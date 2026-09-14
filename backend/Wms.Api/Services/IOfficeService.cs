using Wms.Api.Contracts.Offices;

namespace Wms.Api.Services;

public interface IOfficeService
{
    Task<IReadOnlyList<OfficeResponse>> GetAllAsync();
    Task<OfficeResponse?> GetByIdAsync(int id);
    Task<OfficeResponse> CreateAsync(CreateOfficeRequest request);
}
