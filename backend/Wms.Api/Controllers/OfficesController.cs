using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Offices;
using Wms.Api.Contracts.Warehouses;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api")]
public class OfficesController(
    IOfficeService officeService,
    IWarehouseService warehouseService) : ControllerBase
{
    [HttpGet("offices")]
    public async Task<ActionResult<IReadOnlyList<OfficeResponse>>> GetAll()
    {
        return Ok(await officeService.GetAllAsync());
    }

    [HttpGet("offices/{id:int}")]
    public async Task<ActionResult<OfficeResponse>> GetById(int id)
    {
        var office = await officeService.GetByIdAsync(id);
        return office is null ? NotFound() : Ok(office);
    }

    [HttpPost("offices")]
    public async Task<ActionResult<OfficeResponse>> Create(
        CreateOfficeRequest request)
    {
        try
        {
            var office = await officeService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = office.Id },
                office);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPost("offices/{officeId:int}/warehouses")]
    public async Task<ActionResult<WarehouseResponse>> CreateWarehouse(
        int officeId,
        CreateWarehouseRequest request)
    {
        try
        {
            var warehouse = await warehouseService.CreateAsync(officeId, request);

            return CreatedAtAction(
                nameof(WarehousesController.GetById),
                "Warehouses",
                new { id = warehouse.Id },
                warehouse);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
