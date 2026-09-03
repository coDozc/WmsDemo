using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.StockTransfers;

public class CreateStockTransferRequest
{
    [Required]
    [MaxLength(50)]
    public string TransferNumber { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int FromLocationId { get; set; }

    [Range(1, int.MaxValue)]
    public int ToLocationId { get; set; }

    [Required]
    [MinLength(1)]
    public List<StockTransferLineRequest> Lines { get; set; } = [];
}
