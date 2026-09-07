using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Shipments;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class ShipmentService(WmsDbContext dbContext) : IShipmentService
{
    public async Task<IReadOnlyList<ShipmentResponse>> GetAllAsync()
    {
        var shipments = await ShipmentQuery()
            .OrderByDescending(shipment => shipment.ShippedAtUtc)
            .ToListAsync();

        return shipments.Select(MapToResponse).ToList();
    }

    public async Task<ShipmentResponse?> GetByIdAsync(int id)
    {
        var shipment = await ShipmentQuery()
            .FirstOrDefaultAsync(item => item.Id == id);

        return shipment is null ? null : MapToResponse(shipment);
    }

    public async Task<ShipmentResponse> CreateAsync(CreateShipmentRequest request)
    {
        var shipmentNumber = DocumentNumberGenerator.Create("SVK");
        var carrierName = request.CarrierName.Trim();

        var order = await dbContext.Orders
            .Include(item => item.Warehouse)
            .Include(item => item.Lines)
                .ThenInclude(line => line.Product)
            .FirstOrDefaultAsync(item => item.Id == request.OrderId);

        if (order is null)
        {
            throw new KeyNotFoundException("Sipariş bulunamadı.");
        }

        if (!order.IsActive ||
            order.Status is OrderStatus.Cancelled or OrderStatus.Completed or OrderStatus.Shipping)
        {
            throw new InvalidOperationException(
                "Bu sipariş sevkiyata uygun durumda değil.");
        }

        var location = await dbContext.Locations
            .Include(item => item.Warehouse)
            .FirstOrDefaultAsync(item => item.Id == request.LocationId);

        if (location is null || location.WarehouseId != order.WarehouseId)
        {
            throw new KeyNotFoundException(
                "Sipariş deposuna ait sevkiyat lokasyonu bulunamadı.");
        }

        if (!location.IsActive || !location.Warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo veya lokasyondan sevkiyat yapılamaz.");
        }

        if (location.Type != LocationType.Shipping)
        {
            throw new InvalidOperationException(
                "Sevkiyat yalnızca Shipping tipindeki lokasyondan yapılabilir.");
        }

        var productIds = order.Lines.Select(line => line.ProductId).ToList();

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var balances = await dbContext.InventoryBalances
            .Where(balance =>
                balance.LocationId == request.LocationId &&
                productIds.Contains(balance.ProductId))
            .ToDictionaryAsync(balance => balance.ProductId);

        foreach (var line in order.Lines)
        {
            if (!balances.TryGetValue(line.ProductId, out var balance) ||
                balance.Quantity < line.Quantity)
            {
                throw new InvalidOperationException(
                    $"{line.Product.Name} için sevkiyat lokasyonunda yeterli stok yok.");
            }
        }

        var shipment = new Shipment
        {
            ShipmentNumber = shipmentNumber,
            CarrierName = carrierName,
            OrderId = order.Id,
            LocationId = request.LocationId,
            Lines = order.Lines.Select(line => new ShipmentLine
            {
                ProductId = line.ProductId,
                Quantity = line.Quantity
            }).ToList()
        };

        dbContext.Shipments.Add(shipment);

        foreach (var line in order.Lines)
        {
            var balance = balances[line.ProductId];
            balance.Quantity -= line.Quantity;
            balance.UpdatedAtUtc = DateTime.UtcNow;

            dbContext.StockMovements.Add(new StockMovement
            {
                ProductId = line.ProductId,
                FromLocationId = request.LocationId,
                Quantity = line.Quantity,
                Type = StockMovementType.Shipment,
                Note = $"Sevkiyat {shipmentNumber} - Sipariş {order.OrderNumber} - {carrierName}"
            });
        }

        order.Status = OrderStatus.Completed;
        order.IsActive = false;
        order.ShippedAtUtc = shipment.ShippedAtUtc;

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetByIdAsync(shipment.Id)
            ?? throw new InvalidOperationException(
                "Sevkiyat kaydedildi ancak okunamadı.");
    }

    private IQueryable<Shipment> ShipmentQuery()
    {
        return dbContext.Shipments
            .AsNoTracking()
            .Include(shipment => shipment.Order)
                .ThenInclude(order => order.Warehouse)
            .Include(shipment => shipment.Location)
            .Include(shipment => shipment.Lines)
                .ThenInclude(line => line.Product);
    }

    private static ShipmentResponse MapToResponse(Shipment shipment)
    {
        return new ShipmentResponse
        {
            Id = shipment.Id,
            ShipmentNumber = shipment.ShipmentNumber,
            CarrierName = shipment.CarrierName,
            OrderId = shipment.OrderId,
            OrderNumber = shipment.Order.OrderNumber,
            CustomerName = shipment.Order.CustomerName,
            WarehouseId = shipment.Order.WarehouseId,
            WarehouseName = shipment.Order.Warehouse.Name,
            LocationId = shipment.LocationId,
            LocationCode = shipment.Location.Code,
            ShippedAtUtc = shipment.ShippedAtUtc,
            Lines = shipment.Lines
                .OrderBy(line => line.Product.Name)
                .Select(line => new ShipmentLineResponse
                {
                    Id = line.Id,
                    ProductId = line.ProductId,
                    ProductSku = line.Product.Sku,
                    ProductName = line.Product.Name,
                    Quantity = line.Quantity
                })
                .ToList()
        };
    }
}
