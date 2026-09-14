using Wms.Api.Contracts.Dashboard;

namespace Wms.Api.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync();
}
