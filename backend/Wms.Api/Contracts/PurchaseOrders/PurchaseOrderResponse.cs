namespace Wms.Api.Contracts.PurchaseOrders;

public class PurchaseOrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public List<PurchaseOrderLineResponse> Lines { get; set; } = [];
}
