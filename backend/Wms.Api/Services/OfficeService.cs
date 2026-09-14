using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Offices;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class OfficeService(WmsDbContext dbContext) : IOfficeService
{
    public async Task<IReadOnlyList<OfficeResponse>> GetAllAsync()
    {
        var offices = await dbContext.Offices
            .AsNoTracking()
            .Include(office => office.Warehouses)
            .OrderBy(office => office.City)
            .ThenBy(office => office.Name)
            .ToListAsync();

        return offices.Select(MapToResponse).ToList();
    }

    public async Task<OfficeResponse?> GetByIdAsync(int id)
    {
        var office = await dbContext.Offices
            .AsNoTracking()
            .Include(item => item.Warehouses)
            .FirstOrDefaultAsync(item => item.Id == id);

        return office is null ? null : MapToResponse(office);
    }

    public async Task<OfficeResponse> CreateAsync(
        CreateOfficeRequest request)
    {
        if (!Enum.IsDefined(request.Type))
        {
            throw new InvalidOperationException("Geçersiz ofis tipi.");
        }

        var code = request.Code.Trim().ToUpperInvariant();

        if (await dbContext.Offices.AnyAsync(office =>
                office.Code == code))
        {
            throw new InvalidOperationException(
                "Bu ofis kodu daha önce kullanılmış.");
        }

        if (request.Type == OfficeType.Headquarters &&
            await dbContext.Offices.AnyAsync(office =>
                office.Type == OfficeType.Headquarters))
        {
            throw new InvalidOperationException(
                "Sistemde zaten bir merkez ofis bulunuyor.");
        }

        var office = new Office
        {
            Code = code,
            Name = request.Name.Trim(),
            City = request.City.Trim(),
            District = string.IsNullOrWhiteSpace(request.District)
                ? null
                : request.District.Trim(),
            Type = request.Type
        };

        dbContext.Offices.Add(office);
        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(office.Id)
            ?? throw new InvalidOperationException(
                "Ofis kaydedildi ancak okunamadı.");
    }

    private static OfficeResponse MapToResponse(Office office)
    {
        return new OfficeResponse
        {
            Id = office.Id,
            Code = office.Code,
            Name = office.Name,
            City = office.City,
            District = office.District,
            Type = office.Type,
            IsActive = office.IsActive,
            WarehouseCount = office.Warehouses.Count,
            CreatedAtUtc = office.CreatedAtUtc
        };
    }
}
