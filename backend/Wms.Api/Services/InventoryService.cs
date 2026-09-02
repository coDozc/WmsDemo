using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Inventory;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class InventoryService(WmsDbContext dbContext) : IInventoryService
{
    public async Task<IReadOnlyList<InventoryBalanceResponse>> GetAllAsync(
        int? warehouseId,
        int? locationId,
        int? productId)
    {
        var query = dbContext.InventoryBalances.AsNoTracking();

        if (warehouseId.HasValue)
        {
            query = query.Where(balance =>
                balance.Location.WarehouseId == warehouseId.Value);
        }

        if (locationId.HasValue)
        {
            query = query.Where(balance =>
                balance.LocationId == locationId.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(balance =>
                balance.ProductId == productId.Value);
        }

        return await query
            .OrderBy(balance => balance.Product.Name)
            .ThenBy(balance => balance.Location.Code)
            .Select(ToResponse)
            .ToListAsync();
    }

    public async Task<InventoryBalanceResponse?> GetByIdAsync(int id)
    {
        return await dbContext.InventoryBalances
            .AsNoTracking()
            .Where(balance => balance.Id == id)
            .Select(ToResponse)
            .FirstOrDefaultAsync();
    }

    public async Task<InventoryBalanceResponse> AdjustAsync(
        AdjustStockRequest request)
    {
        var product = await dbContext.Products.FindAsync(request.ProductId);

        if (product is null)
        {
            throw new KeyNotFoundException("Ürün bulunamadı.");
        }

        if (!product.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif ürün için stok işlemi yapılamaz.");
        }

        var location = await dbContext.Locations
            .Include(item => item.Warehouse)
            .FirstOrDefaultAsync(item => item.Id == request.LocationId);

        if (location is null)
        {
            throw new KeyNotFoundException("Lokasyon bulunamadı.");
        }

        if (!location.IsActive || !location.Warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo veya lokasyonda stok işlemi yapılamaz.");
        }

        var balance = await dbContext.InventoryBalances
            .FirstOrDefaultAsync(item =>
                item.ProductId == request.ProductId &&
                item.LocationId == request.LocationId);

        var currentQuantity = balance?.Quantity ?? 0;
        var newQuantity = (long)currentQuantity + request.QuantityChange;

        if (newQuantity < 0)
        {
            throw new InvalidOperationException(
                "Stok miktarı sıfırın altına düşemez.");
        }

        if (newQuantity > int.MaxValue)
        {
            throw new InvalidOperationException(
                "Stok miktarı izin verilen üst sınırı aşıyor.");
        }

        if (balance is null)
        {
            balance = new InventoryBalance
            {
                ProductId = request.ProductId,
                LocationId = request.LocationId,
                Quantity = (int)newQuantity
            };

            dbContext.InventoryBalances.Add(balance);
        }
        else
        {
            balance.Quantity = (int)newQuantity;
            balance.UpdatedAtUtc = DateTime.UtcNow;
        }

        var movement = new StockMovement
        {
            ProductId = request.ProductId,
            FromLocationId = request.QuantityChange < 0
                ? request.LocationId
                : null,
            ToLocationId = request.QuantityChange > 0
                ? request.LocationId
                : null,
            Quantity = (int)Math.Abs((long)request.QuantityChange),
            Type = StockMovementType.Adjustment,
            Note = request.Reason.Trim()
        };

        dbContext.StockMovements.Add(movement);
        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(balance.Id)
            ?? throw new InvalidOperationException("Stok bakiyesi okunamadı.");
    }

    private static readonly Expression<Func<InventoryBalance,
        InventoryBalanceResponse>> ToResponse = balance =>
        new InventoryBalanceResponse
        {
            Id = balance.Id,
            ProductId = balance.ProductId,
            ProductSku = balance.Product.Sku,
            ProductName = balance.Product.Name,
            WarehouseId = balance.Location.WarehouseId,
            WarehouseName = balance.Location.Warehouse.Name,
            LocationId = balance.LocationId,
            LocationCode = balance.Location.Code,
            LocationName = balance.Location.Name,
            LocationType = balance.Location.Type,
            Quantity = balance.Quantity,
            MinimumStock = balance.Product.MinimumStock,
            IsBelowMinimumStock = balance.Quantity < balance.Product.MinimumStock,
            UpdatedAtUtc = balance.UpdatedAtUtc
        };
}
