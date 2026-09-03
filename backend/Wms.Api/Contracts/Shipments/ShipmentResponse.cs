namespace Wms.Api.Contracts.Shipments;

public class ShipmentResponse
{
    public int Id { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string CarrierName { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public DateTime ShippedAtUtc { get; set; }
    public List<ShipmentLineResponse> Lines { get; set; } = [];
}
