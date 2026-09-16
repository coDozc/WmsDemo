using Wms.Api.Contracts.PurchaseOrders;

namespace Wms.Api.Services;

public interface IPurchaseOrderService
{
    Task<IReadOnlyList<PurchaseOrderResponse>> GetAllAsync();
    Task<PurchaseOrderResponse?> GetByIdAsync(int id);
    Task<PurchaseOrderResponse> CreateAsync(CreatePurchaseOrderRequest request);
    Task<bool> UpdateAsync(int id, UpdatePurchaseOrderRequest request);
    Task<bool> ApproveAsync(int id);
    Task<bool> CancelAsync(int id);
}
