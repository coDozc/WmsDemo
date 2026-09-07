using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Inventory;

public class InventoryBalanceResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public LocationType LocationType { get; set; }
    public int Quantity { get; set; }
    public int WarehouseQuantity { get; set; }
    public int MinimumStock { get; set; }
    public bool IsBelowMinimumStock { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
