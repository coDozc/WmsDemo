namespace Wms.Api.Contracts.StockTransfers;

public class StockTransferResponse
{
    public int Id { get; set; }
    public string TransferNumber { get; set; } = string.Empty;
    public int FromLocationId { get; set; }
    public string FromLocationCode { get; set; } = string.Empty;
    public string FromWarehouseName { get; set; } = string.Empty;
    public int ToLocationId { get; set; }
    public string ToLocationCode { get; set; } = string.Empty;
    public string ToWarehouseName { get; set; } = string.Empty;
    public DateTime TransferredAtUtc { get; set; }
    public List<StockTransferLineResponse> Lines { get; set; } = [];
}
