using Wms.Api.Contracts.StockTransfers;

namespace Wms.Api.Services;

public interface IStockTransferService
{
    Task<IReadOnlyList<StockTransferResponse>> GetAllAsync();
    Task<StockTransferResponse?> GetByIdAsync(int id);
    Task<StockTransferResponse> CreateAsync(CreateStockTransferRequest request);
}
