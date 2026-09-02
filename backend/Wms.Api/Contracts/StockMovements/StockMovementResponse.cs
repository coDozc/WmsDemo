using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.StockMovements;

public class StockMovementResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int? FromLocationId { get; set; }
    public string? FromLocationCode { get; set; }
    public string? FromWarehouseName { get; set; }
    public int? ToLocationId { get; set; }
    public string? ToLocationCode { get; set; }
    public string? ToWarehouseName { get; set; }
    public int Quantity { get; set; }
    public StockMovementType Type { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
