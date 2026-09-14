using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Dashboard;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class DashboardService(WmsDbContext dbContext) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync()
    {
        var balances = await dbContext.InventoryBalances
            .AsNoTracking()
            .Include(balance => balance.Product)
            .Include(balance => balance.Location)
                .ThenInclude(location => location.Warehouse)
            .ToListAsync();

        var recentMovements = await dbContext.StockMovements
            .AsNoTracking()
            .Include(movement => movement.Product)
            .Include(movement => movement.FromLocation)
                .ThenInclude(location => location!.Warehouse)
            .Include(movement => movement.ToLocation)
                .ThenInclude(location => location!.Warehouse)
            .OrderByDescending(movement => movement.CreatedAtUtc)
            .Take(8)
            .ToListAsync();

        var activeProductCount = await dbContext.Products.CountAsync(product =>
            product.IsActive);
        var activeWarehouses = await dbContext.Warehouses
            .AsNoTracking()
            .Where(warehouse => warehouse.IsActive)
            .OrderBy(warehouse => warehouse.Name)
            .ToListAsync();
        var activeLocationCount = await dbContext.Locations.CountAsync(location =>
            location.IsActive);
        var openOrderCount = await dbContext.Orders.CountAsync(order =>
            order.IsActive &&
            order.Status != OrderStatus.Completed &&
            order.Status != OrderStatus.Cancelled);

        var todayUtc = DateTime.UtcNow.Date;
        var todayMovementCount = await dbContext.StockMovements.CountAsync(movement =>
            movement.CreatedAtUtc >= todayUtc);

        var productWarehouseStocks = balances
            .GroupBy(balance => new
            {
                balance.ProductId,
                balance.Location.WarehouseId
            })
            .Select(group => new
            {
                group.Key.ProductId,
                group.Key.WarehouseId,
                Quantity = group.Sum(balance => balance.Quantity),
                MinimumStock = group.First().Product.MinimumStock
            })
            .ToList();

        var warehouseStocks = activeWarehouses
            .Select(warehouse => new WarehouseStockSummaryResponse
            {
                WarehouseId = warehouse.Id,
                WarehouseCode = warehouse.Code,
                WarehouseName = warehouse.Name,
                TotalQuantity = balances
                    .Where(balance =>
                        balance.Location.WarehouseId == warehouse.Id)
                    .Sum(balance => balance.Quantity),
                ProductCount = productWarehouseStocks.Count(stock =>
                    stock.WarehouseId == warehouse.Id && stock.Quantity > 0),
                CriticalStockCount = productWarehouseStocks.Count(stock =>
                    stock.WarehouseId == warehouse.Id &&
                    stock.Quantity < stock.MinimumStock)
            })
            .OrderByDescending(warehouse => warehouse.TotalQuantity)
            .ToList();

        return new DashboardResponse
        {
            TotalStockQuantity = balances.Sum(balance => balance.Quantity),
            ActiveProductCount = activeProductCount,
            ActiveWarehouseCount = activeWarehouses.Count,
            ActiveLocationCount = activeLocationCount,
            CriticalStockCount = productWarehouseStocks.Count(stock =>
                stock.Quantity < stock.MinimumStock),
            OpenOrderCount = openOrderCount,
            TodayMovementCount = todayMovementCount,
            UpdatedAtUtc = DateTime.UtcNow,
            WarehouseStocks = warehouseStocks,
            RecentMovements = recentMovements
                .Select(MapMovementToResponse)
                .ToList()
        };
    }

    private static DashboardMovementResponse MapMovementToResponse(
        StockMovement movement)
    {
        return new DashboardMovementResponse
        {
            Id = movement.Id,
            ProductSku = movement.Product.Sku,
            ProductName = movement.Product.Name,
            Type = movement.Type,
            Quantity = movement.Quantity,
            FromWarehouseName = movement.FromLocation?.Warehouse.Name,
            FromLocationCode = movement.FromLocation?.Code,
            ToWarehouseName = movement.ToLocation?.Warehouse.Name,
            ToLocationCode = movement.ToLocation?.Code,
            Note = movement.Note,
            CreatedAtUtc = movement.CreatedAtUtc
        };
    }
}
