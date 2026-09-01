using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Warehouses;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Services;

public class WarehouseService(WmsDbContext dbContext) : IWarehouseService
{
    public async Task<IReadOnlyList<WarehouseResponse>> GetAllAsync()
    {
        var warehouses = await dbContext.Warehouses
            .AsNoTracking()
            .OrderBy(warehouse => warehouse.Name)
            .ToListAsync();

        return warehouses.Select(MapToResponse).ToList();
    }

    public async Task<WarehouseResponse?> GetByIdAsync(int id)
    {
        var warehouse = await dbContext.Warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(warehouse => warehouse.Id == id);

        return warehouse is null ? null : MapToResponse(warehouse);
    }

    public async Task<WarehouseResponse> CreateAsync(
        CreateWarehouseRequest request)
    {
        var code = NormalizeCode(request.Code);

        if (await dbContext.Warehouses.AnyAsync(
                warehouse => warehouse.Code == code))
        {
            throw new InvalidOperationException(
                "Bu kod ile kayıtlı bir depo bulunuyor.");
        }

        var warehouse = new Warehouse
        {
            Code = code,
            Name = request.Name.Trim(),
            IsActive = true
        };

        dbContext.Warehouses.Add(warehouse);
        await dbContext.SaveChangesAsync();

        return MapToResponse(warehouse);
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateWarehouseRequest request)
    {
        var warehouse = await dbContext.Warehouses.FindAsync(id);

        if (warehouse is null)
        {
            return false;
        }

        var code = NormalizeCode(request.Code);

        if (await dbContext.Warehouses.AnyAsync(other =>
                other.Code == code && other.Id != id))
        {
            throw new InvalidOperationException(
                "Bu kod ile kayıtlı bir depo bulunuyor.");
        }

        if (!request.IsActive && warehouse.IsActive)
        {
            await EnsureWarehouseCanBeDeactivatedAsync(id);
        }

        warehouse.Code = code;
        warehouse.Name = request.Name.Trim();
        warehouse.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var warehouse = await dbContext.Warehouses.FindAsync(id);

        if (warehouse is null)
        {
            return false;
        }

        if (!warehouse.IsActive)
        {
            return true;
        }

        await EnsureWarehouseCanBeDeactivatedAsync(id);

        warehouse.IsActive = false;
        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task EnsureWarehouseCanBeDeactivatedAsync(int warehouseId)
    {
        var hasActiveLocations = await dbContext.Locations.AnyAsync(location =>
            location.WarehouseId == warehouseId && location.IsActive);

        if (hasActiveLocations)
        {
            throw new InvalidOperationException(
                "Aktif lokasyonları bulunan depo pasife alınamaz.");
        }
    }

    private static WarehouseResponse MapToResponse(Warehouse warehouse)
    {
        return new WarehouseResponse
        {
            Id = warehouse.Id,
            Code = warehouse.Code,
            Name = warehouse.Name,
            IsActive = warehouse.IsActive,
            CreatedAtUtc = warehouse.CreatedAtUtc
        };
    }

    private static string NormalizeCode(string code)
    {
        return code.Trim().ToUpperInvariant();
    }
}
