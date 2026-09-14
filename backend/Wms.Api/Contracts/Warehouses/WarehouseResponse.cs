namespace Wms.Api.Contracts.Warehouses;

public class WarehouseResponse
{
    public int Id { get; set; }
    public int OfficeId { get; set; }
    public string OfficeName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
