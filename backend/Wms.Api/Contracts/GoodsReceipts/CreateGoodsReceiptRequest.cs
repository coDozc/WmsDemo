using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.GoodsReceipts;

public class CreateGoodsReceiptRequest
{
    [Required]
    [MaxLength(150)]
    public string SupplierName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int WarehouseId { get; set; }

    [Range(1, int.MaxValue)]
    public int LocationId { get; set; }

    [Required]
    [MinLength(1)]
    public List<GoodsReceiptLineRequest> Lines { get; set; } = [];
}
