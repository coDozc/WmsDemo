using Microsoft.EntityFrameworkCore;
using Wms.Application.Products;
using Wms.Domain.Entities;
using Wms.Infrastructure.Persistence;

namespace Wms.Infrastructure.Products;

public class ProductRepository(WmsDbContext dbContext)
    : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync()
    {
        return await dbContext.Products
            .AsNoTracking()
            .OrderBy(product => product.Name)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await dbContext.Products.FindAsync(id);
    }

    public async Task<bool> SkuExistsAsync(
        string sku,
        int? excludedProductId = null)
    {
        return await dbContext.Products.AnyAsync(product =>
            product.Sku == sku &&
            (!excludedProductId.HasValue || product.Id != excludedProductId));
    }

    public async Task AddAsync(Product product)
    {
        await dbContext.Products.AddAsync(product);
    }

    public async Task SaveChangesAsync()
    {
        await dbContext.SaveChangesAsync();
    }
}
