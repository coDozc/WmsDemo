using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Orders;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class OrderService(WmsDbContext dbContext) : IOrderService
{
    public async Task<IReadOnlyList<OrderResponse>> GetAllAsync()
    {
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Warehouse)
            .Include(order => order.Lines)
                .ThenInclude(line => line.Product)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToListAsync();

        return orders.Select(MapToResponse).ToList();
    }

    public async Task<OrderResponse?> GetByIdAsync(int id)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(item => item.Warehouse)
            .Include(item => item.Lines)
                .ThenInclude(line => line.Product)
            .FirstOrDefaultAsync(item => item.Id == id);

        return order is null ? null : MapToResponse(order);
    }

    public async Task<OrderResponse> CreateAsync(CreateOrderRequest request)
    {
        var orderNumber = DocumentNumberGenerator.Create("SIP");

        await ValidateOrderDataAsync(request.WarehouseId, request.Lines);

        var order = new Order
        {
            OrderNumber = orderNumber,
            WarehouseId = request.WarehouseId,
            CustomerName = request.CustomerName.Trim(),
            Status = OrderStatus.Draft,
            IsActive = true,
            Lines = CreateOrderLines(request.Lines)
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(order.Id)
            ?? throw new InvalidOperationException("Sipariş oluşturuldu ancak okunamadı.");
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateOrderRequest request)
    {
        var order = await dbContext.Orders
            .Include(item => item.Lines)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (order is null)
        {
            return false;
        }

        if (order.Status != OrderStatus.Draft)
        {
            throw new InvalidOperationException(
                "Yalnızca taslak siparişler güncellenebilir.");
        }

        await ValidateOrderDataAsync(request.WarehouseId, request.Lines);

        dbContext.OrderLines.RemoveRange(order.Lines);

        order.WarehouseId = request.WarehouseId;
        order.CustomerName = request.CustomerName.Trim();
        order.Lines = CreateOrderLines(request.Lines);

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> CancelAsync(int id)
    {
        var order = await dbContext.Orders.FindAsync(id);

        if (order is null)
        {
            return false;
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            return true;
        }

        if (order.Status is OrderStatus.Shipping or OrderStatus.Completed)
        {
            throw new InvalidOperationException(
                "Sevkiyata çıkmış veya tamamlanmış sipariş iptal edilemez.");
        }

        order.Status = OrderStatus.Cancelled;
        order.IsActive = false;

        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task ValidateOrderDataAsync(
        int warehouseId,
        IReadOnlyCollection<OrderLineRequest> lines)
    {
        var warehouse = await dbContext.Warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == warehouseId);

        if (warehouse is null)
        {
            throw new KeyNotFoundException("Depo bulunamadı.");
        }

        if (!warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo için sipariş oluşturulamaz.");
        }

        if (lines.Count == 0)
        {
            throw new InvalidOperationException(
                "Siparişte en az bir ürün bulunmalıdır.");
        }

        var productIds = lines.Select(line => line.ProductId).ToList();

        if (productIds.Distinct().Count() != productIds.Count)
        {
            throw new InvalidOperationException(
                "Aynı ürün siparişte birden fazla satırda bulunamaz.");
        }

        var activeProductIds = await dbContext.Products
            .AsNoTracking()
            .Where(product =>
                productIds.Contains(product.Id) && product.IsActive)
            .Select(product => product.Id)
            .ToListAsync();

        if (activeProductIds.Count != productIds.Count)
        {
            throw new KeyNotFoundException(
                "Sipariş ürünlerinden biri bulunamadı veya pasif durumda.");
        }
    }

    private static List<OrderLine> CreateOrderLines(
        IEnumerable<OrderLineRequest> requests)
    {
        return requests.Select(request => new OrderLine
        {
            ProductId = request.ProductId,
            Quantity = request.Quantity
        }).ToList();
    }

    private static OrderResponse MapToResponse(Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            WarehouseId = order.WarehouseId,
            WarehouseName = order.Warehouse.Name,
            CustomerName = order.CustomerName,
            Status = order.Status,
            IsActive = order.IsActive,
            CreatedAtUtc = order.CreatedAtUtc,
            ShippedAtUtc = order.ShippedAtUtc,
            Lines = order.Lines
                .OrderBy(line => line.Product.Name)
                .Select(line => new OrderLineResponse
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
