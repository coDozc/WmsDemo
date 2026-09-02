using Wms.Api.Contracts.Orders;

namespace Wms.Api.Services;

public interface IOrderService
{
    Task<IReadOnlyList<OrderResponse>> GetAllAsync();
    Task<OrderResponse?> GetByIdAsync(int id);
    Task<OrderResponse> CreateAsync(CreateOrderRequest request);
    Task<bool> UpdateAsync(int id, UpdateOrderRequest request);
    Task<bool> CancelAsync(int id);
}