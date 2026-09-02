using System.ComponentModel.DataAnnotations;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Contracts.Locations;

public class CreateLocationRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Name { get; set; }

    [Required]
    [EnumDataType(typeof(LocationType))]
    public LocationType? Type { get; set; }
}
