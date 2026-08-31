using Wms.Api.Contracts.Products;

namespace Wms.Api.Services;

public interface IProductService
{
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
    Task<ProductResponse?> GetByIdAsync(int id);
    Task<IReadOnlyList<ProductResponse>> GetAllAsync();
    Task<bool> UpdateAsync(int id, UpdateProductRequest request);
    Task<bool> DeleteAsync(int id);
}
