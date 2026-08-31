using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.Warehouses;

public class CreateWarehouseRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}
