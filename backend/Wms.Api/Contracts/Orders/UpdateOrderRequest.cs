using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.Orders;
public class UpdateOrderRequest
{
    [Range(1, int.MaxValue)]
    public int WarehouseId { get; set; }

    [Required]
    [MaxLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public List<OrderLineRequest> Lines { get; set; } = [];
}
