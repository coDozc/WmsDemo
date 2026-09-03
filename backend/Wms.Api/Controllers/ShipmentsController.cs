using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Shipments;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/shipments")]
public class ShipmentsController(IShipmentService shipmentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ShipmentResponse>>> GetAll()
    {
        return Ok(await shipmentService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShipmentResponse>> GetById(int id)
    {
        var shipment = await shipmentService.GetByIdAsync(id);
        return shipment is null ? NotFound() : Ok(shipment);
    }

    [HttpPost]
    public async Task<ActionResult<ShipmentResponse>> Create(
        CreateShipmentRequest request)
    {
        try
        {
            var shipment = await shipmentService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = shipment.Id }, shipment);
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
