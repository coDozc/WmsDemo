using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Warehouses;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/warehouses")]
public class WarehousesController(IWarehouseService warehouseService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WarehouseResponse>>> GetAll()
    {
        var warehouses = await warehouseService.GetAllAsync();
        return Ok(warehouses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<WarehouseResponse>> GetById(int id)
    {
        var warehouse = await warehouseService.GetByIdAsync(id);

        return warehouse is null ? NotFound() : Ok(warehouse);
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseResponse>> Create(
        CreateWarehouseRequest request)
    {
        try
        {
            var warehouse = await warehouseService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = warehouse.Id },
                warehouse);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateWarehouseRequest request)
    {
        try
        {
            var updated = await warehouseService.UpdateAsync(id, request);

            return updated ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try
        {
            var deactivated = await warehouseService.DeactivateAsync(id);

            return deactivated ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
