using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Dashboard;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get()
    {
        return Ok(await dashboardService.GetAsync());
    }
}
