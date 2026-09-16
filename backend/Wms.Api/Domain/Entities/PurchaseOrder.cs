using Wms.Api.Domain.Enums;

namespace Wms.Api.Domain.Entities;

public class PurchaseOrder
{
    public int Id { get; set; }
    public required string OrderNumber { get; set; }
    public int WarehouseId { get; set; }
    public required string SupplierName { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<PurchaseOrderLine> Lines { get; set; } = [];
}
