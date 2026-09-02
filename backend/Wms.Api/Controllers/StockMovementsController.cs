using Microsoft.AspNetCore.Mvc;
using Wms.Api.Contracts.StockMovements;
using Wms.Api.Domain.Enums;
using Wms.Api.Services;

namespace Wms.Api.Controllers;

[ApiController]
[Route("api/stock-movements")]
public class StockMovementsController(
    IStockMovementService stockMovementService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockMovementResponse>>> GetAll(
        [FromQuery] int? productId,
        [FromQuery] int? locationId,
        [FromQuery] StockMovementType? type)
    {
        var movements = await stockMovementService.GetAllAsync(
            productId,
            locationId,
            type);

        return Ok(movements);
    }
}
