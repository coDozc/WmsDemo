namespace Wms.Api.Contracts.Dashboard;

public class DashboardResponse
{
    public int TotalStockQuantity { get; set; }
    public int ActiveProductCount { get; set; }
    public int ActiveWarehouseCount { get; set; }
    public int ActiveLocationCount { get; set; }
    public int CriticalStockCount { get; set; }
    public int OpenOrderCount { get; set; }
    public int TodayMovementCount { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public IReadOnlyList<WarehouseStockSummaryResponse> WarehouseStocks { get; set; }
        = [];
    public IReadOnlyList<DashboardMovementResponse> RecentMovements { get; set; }
        = [];
}
