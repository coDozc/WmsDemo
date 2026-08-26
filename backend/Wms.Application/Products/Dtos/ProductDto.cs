namespace Wms.Application.Products.Dtos;

public record ProductDto(
    int Id,
    string Sku,
    string Name,
    string? Barcode,
    bool IsActive,
    DateTime CreatedAtUtc,
);
