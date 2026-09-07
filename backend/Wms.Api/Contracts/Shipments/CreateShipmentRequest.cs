using System.ComponentModel.DataAnnotations;

namespace Wms.Api.Contracts.Shipments;

public class CreateShipmentRequest
{
    [Required]
    [MaxLength(100)]
    public string CarrierName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int OrderId { get; set; }

    [Range(1, int.MaxValue)]
    public int LocationId { get; set; }
}
