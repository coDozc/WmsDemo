using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.PurchaseOrders;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/purchase-orders")]
public class PurchaseOrdersController(IPurchaseOrderService purchaseOrderService)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PurchaseOrderResponse>>> GetAll()
    {
        return Ok(await purchaseOrderService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseOrderResponse>> GetById(int id)
    {
        var purchaseOrder = await purchaseOrderService.GetByIdAsync(id);
        return purchaseOrder is null ? NotFound() : Ok(purchaseOrder);
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseOrderResponse>> Create(
        CreatePurchaseOrderRequest request)
    {
        try
        {
            var purchaseOrder = await purchaseOrderService.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = purchaseOrder.Id },
                purchaseOrder);
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

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdatePurchaseOrderRequest request)
    {
        try
        {
            var updated = await purchaseOrderService.UpdateAsync(id, request);
            return updated ? NoContent() : NotFound();
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

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        try
        {
            var approved = await purchaseOrderService.ApproveAsync(id);
            return approved ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var cancelled = await purchaseOrderService.CancelAsync(id);
            return cancelled ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
