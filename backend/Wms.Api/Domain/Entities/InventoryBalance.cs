namespace Wms.Api.Domain.Entities;

public class InventoryBalance
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int LocationId { get; set; }
    public int Quantity { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public Product Product { get; set; } = null!;
    public Location Location { get; set; } = null!;
}
