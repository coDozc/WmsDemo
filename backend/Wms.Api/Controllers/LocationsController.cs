using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Locations;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api")]
public class LocationsController(ILocationService locationService)
    : ControllerBase
{
    [HttpGet("warehouses/{warehouseId:int}/locations")]
    public async Task<ActionResult<IReadOnlyList<LocationResponse>>>
        GetByWarehouseId(int warehouseId)
    {
        var locations = await locationService
            .GetByWarehouseIdAsync(warehouseId);

        return locations is null ? NotFound() : Ok(locations);
    }

    [HttpGet("locations/{id:int}")]
    public async Task<ActionResult<LocationResponse>> GetById(int id)
    {
        var location = await locationService.GetByIdAsync(id);

        return location is null ? NotFound() : Ok(location);
    }

    [HttpPost("warehouses/{warehouseId:int}/locations")]
    public async Task<ActionResult<LocationResponse>> Create(
        int warehouseId,
        CreateLocationRequest request)
    {
        try
        {
            var location = await locationService.CreateAsync(
                warehouseId,
                request);

            if (location is null)
            {
                return NotFound();
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = location.Id },
                location);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("locations/{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateLocationRequest request)
    {
        try
        {
            var updated = await locationService.UpdateAsync(id, request);

            return updated ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpDelete("locations/{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var deactivated = await locationService.DeactivateAsync(id);

        return deactivated ? NoContent() : NotFound();
    }
}
