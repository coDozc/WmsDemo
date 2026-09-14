namespace Wms.Api.Contracts.Dashboard;

public class WarehouseStockSummaryResponse
{
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int ProductCount { get; set; }
    public int CriticalStockCount { get; set; }
}
