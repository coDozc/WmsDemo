using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.Inventory;

public class AdjustStockRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int LocationId { get; set; }

    public int QuantityChange { get; set; }

    [Required]
    [MaxLength(250)]
    public string Reason { get; set; } = string.Empty;
}
