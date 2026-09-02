using Wms.Api.Contracts.Warehouses;

namespace Wms.Api.Services;

public interface IWarehouseService
{
    Task<IReadOnlyList<WarehouseResponse>> GetAllAsync();
    Task<WarehouseResponse?> GetByIdAsync(int id);
    Task<WarehouseResponse> CreateAsync(CreateWarehouseRequest request);
    Task<bool> UpdateAsync(int id, UpdateWarehouseRequest request);
    Task<bool> DeactivateAsync(int id);
}
    