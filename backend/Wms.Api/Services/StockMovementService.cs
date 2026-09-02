using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.StockMovements;
using Wms.Api.Data;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class StockMovementService(WmsDbContext dbContext)
    : IStockMovementService
{
    public async Task<IReadOnlyList<StockMovementResponse>> GetAllAsync(
        int? productId,
        int? locationId,
        StockMovementType? type)
    {
        var query = dbContext.StockMovements.AsNoTracking();

        if (productId.HasValue)
        {
            query = query.Where(movement =>
                movement.ProductId == productId.Value);
        }

        if (locationId.HasValue)
        {
            query = query.Where(movement =>
                movement.FromLocationId == locationId.Value ||
                movement.ToLocationId == locationId.Value);
        }

        if (type.HasValue)
        {
            query = query.Where(movement => movement.Type == type.Value);
        }

        return await query
            .OrderByDescending(movement => movement.CreatedAtUtc)
            .Select(movement => new StockMovementResponse
            {
                Id = movement.Id,
                ProductId = movement.ProductId,
                ProductSku = movement.Product.Sku,
                ProductName = movement.Product.Name,
                FromLocationId = movement.FromLocationId,
                FromLocationCode = movement.FromLocation == null
                    ? null
                    : movement.FromLocation.Code,
                FromWarehouseName = movement.FromLocation == null
                    ? null
                    : movement.FromLocation.Warehouse.Name,
                ToLocationId = movement.ToLocationId,
                ToLocationCode = movement.ToLocation == null
                    ? null
                    : movement.ToLocation.Code,
                ToWarehouseName = movement.ToLocation == null
                    ? null
                    : movement.ToLocation.Warehouse.Name,
                Quantity = movement.Quantity,
                Type = movement.Type,
                Note = movement.Note,
                CreatedAtUtc = movement.CreatedAtUtc
            })
            .ToListAsync();
    }
}
