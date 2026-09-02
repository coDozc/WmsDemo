using Wms.Api.Contracts.StockMovements;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public interface IStockMovementService
{
    Task<IReadOnlyList<StockMovementResponse>> GetAllAsync(
        int? productId,
        int? locationId,
        StockMovementType? type);
}
