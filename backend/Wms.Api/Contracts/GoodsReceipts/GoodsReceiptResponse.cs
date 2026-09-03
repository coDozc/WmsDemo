namespace Wms.Api.Contracts.GoodsReceipts;

public class GoodsReceiptResponse
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public DateTime ReceivedAtUtc { get; set; }
    public List<GoodsReceiptLineResponse> Lines { get; set; } = [];
}
