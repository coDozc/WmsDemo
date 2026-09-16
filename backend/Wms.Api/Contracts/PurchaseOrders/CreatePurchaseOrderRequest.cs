using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.PurchaseOrders;

public class CreatePurchaseOrderRequest
{
    [Range(1, int.MaxValue)]
    public int WarehouseId { get; set; }

    [Required]
    [MaxLength(150)]
    public string SupplierName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public List<PurchaseOrderLineRequest> Lines { get; set; } = [];
}
