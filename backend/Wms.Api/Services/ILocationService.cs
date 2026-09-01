using Wms.Api.Contracts.Locations;

namespace Wms.Api.Services;

public interface ILocationService
{
    Task<IReadOnlyList<LocationResponse>?> GetByWarehouseIdAsync(
        int warehouseId);

    Task<LocationResponse?> GetByIdAsync(int id);

    Task<LocationResponse?> CreateAsync(
        int warehouseId,
        CreateLocationRequest request);

    Task<bool> UpdateAsync(int id, UpdateLocationRequest request);
    Task<bool> DeactivateAsync(int id);
}
