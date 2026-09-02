using Wms.Api.Domain.Enums;

namespace Wms.Api.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public required string OrderNumber { get; set; }
    public int WarehouseId { get; set; }
    public required string CustomerName { get; set; }
    public DateTime? ShippedAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<OrderLine> Lines { get; set; } = [];
}
