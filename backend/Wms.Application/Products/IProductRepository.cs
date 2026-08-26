using Wms.Domain.Entities;

namespace Wms.Application.Products;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<bool> SkuExistsAsync(string sku, int? excludedProductId = null);
    Task AddAsync(Product product);
    Task SaveChangesAsync();
}
