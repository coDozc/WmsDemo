using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Locations;

public class LocationResponse
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public LocationType Type { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
