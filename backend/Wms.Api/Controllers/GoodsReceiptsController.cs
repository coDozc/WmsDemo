using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.GoodsReceipts;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/goods-receipts")]
public class GoodsReceiptsController(IGoodsReceiptService goodsReceiptService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GoodsReceiptResponse>>> GetAll()
    {
        return Ok(await goodsReceiptService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GoodsReceiptResponse>> GetById(int id)
    {
        var receipt = await goodsReceiptService.GetByIdAsync(id);
        return receipt is null ? NotFound() : Ok(receipt);
    }

    [HttpPost]
    public async Task<ActionResult<GoodsReceiptResponse>> Create(
        CreateGoodsReceiptRequest request)
    {
        try
        {
            var receipt = await goodsReceiptService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = receipt.Id },
                receipt);
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
