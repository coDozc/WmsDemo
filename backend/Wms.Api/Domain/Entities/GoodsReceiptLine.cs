namespace Wms.Api.Domain.Entities;

public class GoodsReceiptLine
{
    public int Id { get; set; }
    public int GoodsReceiptId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public GoodsReceipt GoodsReceipt { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
