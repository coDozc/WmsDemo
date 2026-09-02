using Wms.Api.Domain.Enums;

namespace Wms.Api.Domain.Entities;

public class StockMovement
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int? FromLocationId { get; set; }
    public int? ToLocationId { get; set; }
    public int Quantity { get; set; }
    public StockMovementType Type { get; set; }
    public required string Note { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Product Product { get; set; } = null!;
    public Location? FromLocation { get; set; }
    public Location? ToLocation { get; set; }
}
