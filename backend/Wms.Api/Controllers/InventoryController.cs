using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.Inventory;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController(IInventoryService inventoryService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventoryBalanceResponse>>> GetAll(
        [FromQuery] int? warehouseId,
        [FromQuery] int? locationId,
        [FromQuery] int? productId)
    {
        var balances = await inventoryService.GetAllAsync(
            warehouseId,
            locationId,
            productId);

        return Ok(balances);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InventoryBalanceResponse>> GetById(int id)
    {
        var balance = await inventoryService.GetByIdAsync(id);

        return balance is null ? NotFound() : Ok(balance);
    }

    [HttpPost("adjustments")]
    public async Task<ActionResult<InventoryBalanceResponse>> Adjust(
        AdjustStockRequest request)
    {
        if (request.QuantityChange == 0)
        {
            return BadRequest(new
            {
                message = "Miktar değişimi sıfır olamaz."
            });
        }

        try
        {
            var balance = await inventoryService.AdjustAsync(request);
            return Ok(balance);
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
