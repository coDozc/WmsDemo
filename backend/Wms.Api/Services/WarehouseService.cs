using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Warehouses;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Services;

public class WarehouseService(WmsDbContext dbContext) : IWarehouseService
{
    public async Task<IReadOnlyList<WarehouseResponse>> GetAllAsync(
        int? officeId = null)
    {
        var query = dbContext.Warehouses
            .AsNoTracking()
            .Include(warehouse => warehouse.Office)
            .AsQueryable();

        if (officeId.HasValue)
        {
            query = query.Where(warehouse => warehouse.OfficeId == officeId.Value);
        }

        var warehouses = await query
            .OrderBy(warehouse => warehouse.Name)
            .ToListAsync();

        return warehouses.Select(MapToResponse).ToList();
    }

    public async Task<WarehouseResponse?> GetByIdAsync(int id)
    {
        var warehouse = await dbContext.Warehouses
            .AsNoTracking()
            .Include(item => item.Office)
            .FirstOrDefaultAsync(warehouse => warehouse.Id == id);

        return warehouse is null ? null : MapToResponse(warehouse);
    }

    public async Task<WarehouseResponse> CreateAsync(
        int officeId,
        CreateWarehouseRequest request)
    {
        var office = await dbContext.Offices.FindAsync(officeId);

        if (office is null)
        {
            throw new KeyNotFoundException("Ofis bulunamadı.");
        }

        if (!office.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif ofise depo eklenemez.");
        }

        var code = NormalizeCode(request.Code);

        if (await dbContext.Warehouses.AnyAsync(
                warehouse =>
                    warehouse.OfficeId == officeId &&
                    warehouse.Code == code))
        {
            throw new InvalidOperationException(
                "Bu kod ile kayıtlı bir depo bulunuyor.");
        }

        var warehouse = new Warehouse
        {
            OfficeId = officeId,
            Code = code,
            Name = request.Name.Trim(),
            IsActive = true,
            Office = office
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
                other.OfficeId == warehouse.OfficeId &&
                other.Code == code &&
                other.Id != id))
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
            OfficeId = warehouse.OfficeId,
            OfficeName = warehouse.Office.Name,
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
