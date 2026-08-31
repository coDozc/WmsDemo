using Wms.Api.Domain.Enums;

namespace Wms.Api.Domain.Entities;

public class Location
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public LocationType Type { get; set; } = LocationType.Storage;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public Warehouse Warehouse { get; set; } = null!;
}
