using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Locations;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Services;

public class LocationService(WmsDbContext dbContext) : ILocationService
{
    public async Task<IReadOnlyList<LocationResponse>?> GetByWarehouseIdAsync(
        int warehouseId)
    {
        var warehouseExists = await dbContext.Warehouses
            .AnyAsync(warehouse => warehouse.Id == warehouseId);

        if (!warehouseExists)
        {
            return null;
        }

        var locations = await dbContext.Locations
            .AsNoTracking()
            .Include(location => location.Warehouse)
            .Where(location => location.WarehouseId == warehouseId)
            .OrderBy(location => location.Code)
            .ToListAsync();

        return locations.Select(MapToResponse).ToList();
    }

    public async Task<LocationResponse?> GetByIdAsync(int id)
    {
        var location = await dbContext.Locations
            .AsNoTracking()
            .Include(location => location.Warehouse)
            .FirstOrDefaultAsync(location => location.Id == id);

        return location is null ? null : MapToResponse(location);
    }

    public async Task<LocationResponse?> CreateAsync(
        int warehouseId,
        CreateLocationRequest request)
    {
        var warehouse = await dbContext.Warehouses.FindAsync(warehouseId);

        if (warehouse is null)
        {
            return null;
        }

        if (!warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depoya lokasyon eklenemez.");
        }

        var code = NormalizeCode(request.Code);

        if (await CodeExistsAsync(warehouseId, code))
        {
            throw new InvalidOperationException(
                "Bu kod aynı depodaki başka bir lokasyonda kullanılıyor.");
        }

        var location = new Location
        {
            WarehouseId = warehouseId,
            Code = code,
            Name = NormalizeName(request.Name),
            Type = request.Type!.Value,
            IsActive = true
        };

        dbContext.Locations.Add(location);
        await dbContext.SaveChangesAsync();

        location.Warehouse = warehouse;
        return MapToResponse(location);
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateLocationRequest request)
    {
        var location = await dbContext.Locations.FindAsync(id);

        if (location is null)
        {
            return false;
        }

        var code = NormalizeCode(request.Code);

        if (await CodeExistsAsync(location.WarehouseId, code, id))
        {
            throw new InvalidOperationException(
                "Bu kod aynı depodaki başka bir lokasyonda kullanılıyor.");
        }

        if (request.IsActive && !location.IsActive)
        {
            var warehouseIsActive = await dbContext.Warehouses.AnyAsync(
                warehouse => warehouse.Id == location.WarehouseId &&
                             warehouse.IsActive);

            if (!warehouseIsActive)
            {
                throw new InvalidOperationException(
                    "Pasif depodaki lokasyon aktifleştirilemez.");
            }
        }

        if (!request.IsActive && location.IsActive)
        {
            await EnsureLocationHasNoStockAsync(id);
        }

        location.Code = code;
        location.Name = NormalizeName(request.Name);
        location.Type = request.Type!.Value;
        location.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var location = await dbContext.Locations.FindAsync(id);

        if (location is null)
        {
            return false;
        }

        if (!location.IsActive)
        {
            return true;
        }

        await EnsureLocationHasNoStockAsync(id);

        location.IsActive = false;
        await dbContext.SaveChangesAsync();

        return true;
    }

    private Task<bool> CodeExistsAsync(
        int warehouseId,
        string code,
        int? excludedLocationId = null)
    {
        return dbContext.Locations.AnyAsync(location =>
            location.WarehouseId == warehouseId &&
            location.Code == code &&
            (!excludedLocationId.HasValue ||
             location.Id != excludedLocationId.Value));
    }

    private static LocationResponse MapToResponse(Location location)
    {
        return new LocationResponse
        {
            Id = location.Id,
            WarehouseId = location.WarehouseId,
            WarehouseName = location.Warehouse.Name,
            Code = location.Code,
            Name = location.Name,
            Type = location.Type,
            IsActive = location.IsActive,
            CreatedAtUtc = location.CreatedAtUtc
        };
    }

    private static string NormalizeCode(string code)
    {
        return code.Trim().ToUpperInvariant();
    }

    private static string? NormalizeName(string? name)
    {
        return string.IsNullOrWhiteSpace(name) ? null : name.Trim();
    }

    private async Task EnsureLocationHasNoStockAsync(int locationId)
    {
        var hasStock = await dbContext.InventoryBalances.AnyAsync(balance =>
            balance.LocationId == locationId && balance.Quantity > 0);

        if (hasStock)
        {
            throw new InvalidOperationException(
                "Stok bakiyesi bulunan lokasyon pasife alınamaz.");
        }
    }
}
