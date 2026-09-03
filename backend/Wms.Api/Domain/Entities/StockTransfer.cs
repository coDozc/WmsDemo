namespace Wms.Api.Domain.Entities;

public class StockTransfer
{
    public int Id { get; set; }
    public required string TransferNumber { get; set; }
    public int FromLocationId { get; set; }
    public int ToLocationId { get; set; }
    public DateTime TransferredAtUtc { get; set; } = DateTime.UtcNow;
    public Location FromLocation { get; set; } = null!;
    public Location ToLocation { get; set; } = null!;
    public ICollection<StockTransferLine> Lines { get; set; } = [];
}
