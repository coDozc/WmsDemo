using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.GoodsReceipts;

public class GoodsReceiptLineRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}
