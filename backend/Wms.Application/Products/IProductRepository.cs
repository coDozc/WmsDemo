using Wms.Domain.Entities;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<bool> SkuExistsAsync(string sku);
    Task AddAsync(Product product);
    Task SaveChangesAsync();
}