using Wms.Api.Contracts.Warehouses;

namespace Wms.Api.Services;

public interface IWarehouseService
{
    Task<IReadOnlyList<WarehouseResponse>> GetAllAsync(int? officeId = null);
    Task<WarehouseResponse?> GetByIdAsync(int id);
    Task<WarehouseResponse> CreateAsync(
        int officeId,
        CreateWarehouseRequest request);
    Task<bool> UpdateAsync(int id, UpdateWarehouseRequest request);
    Task<bool> DeactivateAsync(int id);
}
