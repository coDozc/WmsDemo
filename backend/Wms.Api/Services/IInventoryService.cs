using Wms.Api.Contracts.Inventory;

namespace Wms.Api.Services;

public interface IInventoryService
{
    Task<IReadOnlyList<InventoryBalanceResponse>> GetAllAsync(
        int? warehouseId,
        int? locationId,
        int? productId,
        bool includeZero);

    Task<InventoryBalanceResponse?> GetByIdAsync(int id);
    Task<InventoryBalanceResponse> AdjustAsync(AdjustStockRequest request);
}
