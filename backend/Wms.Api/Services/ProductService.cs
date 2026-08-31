using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.Products;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Services;

public class ProductService(WmsDbContext dbContext) : IProductService
{
    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var sku = request.Sku.Trim().ToUpperInvariant();
        var barcode = NormalizeBarcode(request.Barcode);

        if (await dbContext.Products.AnyAsync(product => product.Sku == sku))
        {
            throw new InvalidOperationException(
                "Bu SKU ile kayıtlı bir ürün bulunuyor.");
        }

        if (barcode is not null &&
            await dbContext.Products.AnyAsync(product => product.Barcode == barcode))
        {
            throw new InvalidOperationException(
                "Bu barkod başka bir üründe kullanılıyor.");
        }

        var product = new Product
        {
            Sku = sku,
            Name = request.Name.Trim(),
            Barcode = barcode,
            IsActive = true
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        return MapToResponse(product);
    }

    public async Task<ProductResponse?> GetByIdAsync(int id)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(product => product.Id == id);

        return product is null ? null : MapToResponse(product);
    }

    public async Task<IReadOnlyList<ProductResponse>> GetAllAsync()
    {
        var products = await dbContext.Products
            .AsNoTracking()
            .OrderBy(product => product.Name)
            .ToListAsync();

        return products.Select(MapToResponse).ToList();
    }

    public async Task<bool> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await dbContext.Products.FindAsync(id);

        if (product is null)
        {
            return false;
        }

        var sku = request.Sku.Trim().ToUpperInvariant();
        var barcode = NormalizeBarcode(request.Barcode);

        if (await dbContext.Products.AnyAsync(other =>
                other.Sku == sku && other.Id != id))
        {
            throw new InvalidOperationException(
                "Bu SKU ile kayıtlı bir ürün bulunuyor.");
        }

        if (barcode is not null &&
            await dbContext.Products.AnyAsync(other =>
                other.Barcode == barcode && other.Id != id))
        {
            throw new InvalidOperationException(
                "Bu barkod başka bir üründe kullanılıyor.");
        }

        product.Sku = sku;
        product.Name = request.Name.Trim();
        product.Barcode = barcode;
        product.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await dbContext.Products.FindAsync(id);

        if (product is null)
        {
            return false;
        }

        product.IsActive = false;
        await dbContext.SaveChangesAsync();

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

    private static string? NormalizeBarcode(string? barcode)
    {
        return string.IsNullOrWhiteSpace(barcode) ? null : barcode.Trim();
    }
}
