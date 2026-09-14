using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Offices;

public class OfficeResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public OfficeType Type { get; set; }
    public bool IsActive { get; set; }
    public int WarehouseCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
