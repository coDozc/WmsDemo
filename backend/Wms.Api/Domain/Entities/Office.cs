using Wms.Api.Domain.Enums;

namespace Wms.Api.Domain.Entities;

public class Office
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string City { get; set; }
    public string? District { get; set; }
    public OfficeType Type { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<Warehouse> Warehouses { get; set; } = [];
}
