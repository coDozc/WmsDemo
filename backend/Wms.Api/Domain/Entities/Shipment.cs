namespace Wms.Api.Domain.Entities;

public class Shipment
{
    public int Id { get; set; }
    public required string ShipmentNumber { get; set; }
    public required string CarrierName { get; set; }
    public int OrderId { get; set; }
    public int LocationId { get; set; }
    public DateTime ShippedAtUtc { get; set; } = DateTime.UtcNow;
    public Order Order { get; set; } = null!;
    public Location Location { get; set; } = null!;
    public ICollection<ShipmentLine> Lines { get; set; } = [];
}
