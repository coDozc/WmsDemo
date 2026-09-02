using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Orders;

public class OrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ShippedAtUtc { get; set; }
    public List<OrderLineResponse> Lines { get; set; } = [];
}
