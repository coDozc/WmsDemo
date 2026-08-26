using Wms.Application.Products.Requests;
using Wms.Application.Products.Response;
using Wms.Domain.Entities;

namespace Wms.Application.Products;

public class ProductService(IProductRepository productRepository)
    : IProductService
{
    public async Task<ProductResponse> CreateAsync(
        CreateProductRequest request)
    {
        var sku = request.Sku.Trim().ToUpperInvariant();

        if (await productRepository.SkuExistsAsync(sku))
        {
            throw new InvalidOperationException(
                "Bu SKU ile kayıtlı bir ürün bulunuyor.");
        }

        var product = new Product
        {
            Sku = sku,
            Name = request.Name.Trim(),
            Barcode = request.Barcode?.Trim(),
            IsActive = true
        };

        await productRepository.AddAsync(product);
        await productRepository.SaveChangesAsync();

        return MapToResponse(product);
    }

    public async Task<ProductResponse?> GetByIdAsync(int id)
    {
        var product = await productRepository.GetByIdAsync(id);

        return product is null ? null : MapToResponse(product);
    }

    public async Task<IReadOnlyList<ProductResponse>> GetAllAsync()
    {
        var products = await productRepository.GetAllAsync();

        return products.Select(MapToResponse).ToList();
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateProductRequest request)
    {
        var product = await productRepository.GetByIdAsync(id);

        if (product is null)
        {
            return false;
        }

        var sku = request.Sku.Trim().ToUpperInvariant();

        if (await productRepository.SkuExistsAsync(sku, id))
        {
            throw new InvalidOperationException(
                "Bu SKU ile kayıtlı bir ürün bulunuyor.");
        }

        product.Sku = sku;
        product.Name = request.Name.Trim();
        product.Barcode = request.Barcode?.Trim();
        product.IsActive = request.IsActive;

        await productRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await productRepository.GetByIdAsync(id);

        if (product is null)
        {
            return false;
        }

        product.IsActive = false;
        await productRepository.SaveChangesAsync();

        return true;
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Barcode = product.Barcode,
            IsActive = product.IsActive,
            CreatedAtUtc = product.CreatedAtUtc
        };
    }
}
