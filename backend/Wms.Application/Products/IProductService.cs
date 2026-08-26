using Wms.Domain.Entities;

namespace Wms.Application.Products;

public interface IProductService
{
    Task<Product> CreateAsync(Product product);
    Task<Product?> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetAllAsync();
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
}