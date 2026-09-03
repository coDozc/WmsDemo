using Wms.Api.Contracts.Shipments;

namespace Wms.Api.Services;

public interface IShipmentService
{
    Task<IReadOnlyList<ShipmentResponse>> GetAllAsync();
    Task<ShipmentResponse?> GetByIdAsync(int id);
    Task<ShipmentResponse> CreateAsync(CreateShipmentRequest request);
}
