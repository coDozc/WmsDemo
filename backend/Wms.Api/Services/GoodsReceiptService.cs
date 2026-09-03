using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.GoodsReceipts;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class GoodsReceiptService(WmsDbContext dbContext)
    : IGoodsReceiptService
{
    public async Task<IReadOnlyList<GoodsReceiptResponse>> GetAllAsync()
    {
        var receipts = await ReceiptQuery()
            .OrderByDescending(receipt => receipt.ReceivedAtUtc)
            .ToListAsync();

        return receipts.Select(MapToResponse).ToList();
    }

    public async Task<GoodsReceiptResponse?> GetByIdAsync(int id)
    {
        var receipt = await ReceiptQuery()
            .FirstOrDefaultAsync(item => item.Id == id);

        return receipt is null ? null : MapToResponse(receipt);
    }

    public async Task<GoodsReceiptResponse> CreateAsync(
        CreateGoodsReceiptRequest request)
    {
        var receiptNumber = request.ReceiptNumber.Trim().ToUpperInvariant();
        var supplierName = request.SupplierName.Trim();

        if (await dbContext.GoodsReceipts.AnyAsync(receipt =>
                receipt.ReceiptNumber == receiptNumber))
        {
            throw new InvalidOperationException(
                "Bu mal kabul numarası daha önce kullanılmış.");
        }

        var location = await dbContext.Locations
            .Include(item => item.Warehouse)
            .FirstOrDefaultAsync(item => item.Id == request.LocationId);

        if (location is null || location.WarehouseId != request.WarehouseId)
        {
            throw new KeyNotFoundException(
                "Seçilen depoya ait lokasyon bulunamadı.");
        }

        if (!location.IsActive || !location.Warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo veya lokasyonda mal kabul yapılamaz.");
        }

        if (location.Type != LocationType.Receiving)
        {
            throw new InvalidOperationException(
                "Mal kabul yalnızca Receiving tipindeki lokasyona yapılabilir.");
        }

        var productIds = request.Lines.Select(line => line.ProductId).ToList();

        if (productIds.Distinct().Count() != productIds.Count)
        {
            throw new InvalidOperationException(
                "Aynı ürün mal kabul belgesinde birden fazla satırda bulunamaz.");
        }

        var activeProductIds = await dbContext.Products
            .AsNoTracking()
            .Where(product => productIds.Contains(product.Id) && product.IsActive)
            .Select(product => product.Id)
            .ToListAsync();

        if (activeProductIds.Count != productIds.Count)
        {
            throw new KeyNotFoundException(
                "Ürünlerden biri bulunamadı veya pasif durumda.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var balances = await dbContext.InventoryBalances
            .Where(balance =>
                balance.LocationId == request.LocationId &&
                productIds.Contains(balance.ProductId))
            .ToDictionaryAsync(balance => balance.ProductId);

        var receipt = new GoodsReceipt
        {
            ReceiptNumber = receiptNumber,
            SupplierName = supplierName,
            WarehouseId = request.WarehouseId,
            LocationId = request.LocationId,
            Lines = request.Lines.Select(line => new GoodsReceiptLine
            {
                ProductId = line.ProductId,
                Quantity = line.Quantity
            }).ToList()
        };

        dbContext.GoodsReceipts.Add(receipt);

        foreach (var line in request.Lines)
        {
            if (!balances.TryGetValue(line.ProductId, out var balance))
            {
                balance = new InventoryBalance
                {
                    ProductId = line.ProductId,
                    LocationId = request.LocationId,
                    Quantity = line.Quantity
                };
                dbContext.InventoryBalances.Add(balance);
            }
            else
            {
                var newQuantity = (long)balance.Quantity + line.Quantity;

                if (newQuantity > int.MaxValue)
                {
                    throw new InvalidOperationException(
                        "Stok miktarı izin verilen üst sınırı aşıyor.");
                }

                balance.Quantity = (int)newQuantity;
                balance.UpdatedAtUtc = DateTime.UtcNow;
            }

            dbContext.StockMovements.Add(new StockMovement
            {
                ProductId = line.ProductId,
                ToLocationId = request.LocationId,
                Quantity = line.Quantity,
                Type = StockMovementType.Receipt,
                Note = $"Mal kabul {receiptNumber} - {supplierName}"
            });
        }

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetByIdAsync(receipt.Id)
            ?? throw new InvalidOperationException(
                "Mal kabul kaydedildi ancak okunamadı.");
    }

    private IQueryable<GoodsReceipt> ReceiptQuery()
    {
        return dbContext.GoodsReceipts
            .AsNoTracking()
            .Include(receipt => receipt.Warehouse)
            .Include(receipt => receipt.Location)
            .Include(receipt => receipt.Lines)
                .ThenInclude(line => line.Product);
    }

    private static GoodsReceiptResponse MapToResponse(GoodsReceipt receipt)
    {
        return new GoodsReceiptResponse
        {
            Id = receipt.Id,
            ReceiptNumber = receipt.ReceiptNumber,
            SupplierName = receipt.SupplierName,
            WarehouseId = receipt.WarehouseId,
            WarehouseName = receipt.Warehouse.Name,
            LocationId = receipt.LocationId,
            LocationCode = receipt.Location.Code,
            ReceivedAtUtc = receipt.ReceivedAtUtc,
            Lines = receipt.Lines
                .OrderBy(line => line.Product.Name)
                .Select(line => new GoodsReceiptLineResponse
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
