using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.StockTransfers;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/stock-transfers")]
public class StockTransfersController(IStockTransferService stockTransferService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockTransferResponse>>> GetAll()
    {
        return Ok(await stockTransferService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StockTransferResponse>> GetById(int id)
    {
        var transfer = await stockTransferService.GetByIdAsync(id);
        return transfer is null ? NotFound() : Ok(transfer);
    }

    [HttpPost]
    public async Task<ActionResult<StockTransferResponse>> Create(
        CreateStockTransferRequest request)
    {
        try
        {
            var transfer = await stockTransferService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = transfer.Id }, transfer);
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
