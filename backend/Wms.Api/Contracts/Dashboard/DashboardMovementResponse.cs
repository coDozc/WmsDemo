using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Dashboard;

public class DashboardMovementResponse
{
    public int Id { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public string? FromWarehouseName { get; set; }
    public string? FromLocationCode { get; set; }
    public string? ToWarehouseName { get; set; }
    public string? ToLocationCode { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
