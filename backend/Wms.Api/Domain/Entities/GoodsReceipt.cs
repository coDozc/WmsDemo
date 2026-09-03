namespace Wms.Api.Domain.Entities;

public class GoodsReceipt
{
    public int Id { get; set; }
    public required string ReceiptNumber { get; set; }
    public required string SupplierName { get; set; }
    public int WarehouseId { get; set; }
    public int LocationId { get; set; }
    public DateTime ReceivedAtUtc { get; set; } = DateTime.UtcNow;
    public Warehouse Warehouse { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public ICollection<GoodsReceiptLine> Lines { get; set; } = [];
}
