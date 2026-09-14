using System.ComponentModel.DataAnnotations;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Offices;

public class CreateOfficeRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? District { get; set; }

    public OfficeType Type { get; set; }
}
