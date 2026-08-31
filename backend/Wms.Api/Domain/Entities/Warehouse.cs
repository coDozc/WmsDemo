namespace Wms.Api.Domain.Entities;

public class Warehouse
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<Location> Locations { get; set; } = [];
}
