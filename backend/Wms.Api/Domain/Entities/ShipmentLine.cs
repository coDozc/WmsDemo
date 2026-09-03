namespace Wms.Api.Domain.Entities;

public class ShipmentLine
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public Shipment Shipment { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
