using System.ComponentModel.DataAnnotations;

namespace Wms.Application.Products.Requests;

public class CreateProductRequest
{
    [Required]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Barcode { get; set; }
}