using System.ComponentModel.DataAnnotations;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Locations;

public class UpdateLocationRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EnumDataType(typeof(LocationType))]
    public LocationType? Type { get; set; }

    public bool IsActive { get; set; } = true;
}
