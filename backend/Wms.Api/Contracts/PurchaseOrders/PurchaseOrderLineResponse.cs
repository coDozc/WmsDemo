namespace Wms.Api.Contracts.PurchaseOrders;

public class PurchaseOrderLineResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int OrderedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public int RemainingQuantity { get; set; }
}
