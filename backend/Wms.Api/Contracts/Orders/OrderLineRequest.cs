using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.Orders;

public class OrderLineRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}
