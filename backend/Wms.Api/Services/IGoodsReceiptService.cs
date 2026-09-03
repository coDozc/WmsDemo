using Wms.Api.Contracts.GoodsReceipts;

namespace Wms.Api.Services;

public interface IGoodsReceiptService
{
    Task<IReadOnlyList<GoodsReceiptResponse>> GetAllAsync();
    Task<GoodsReceiptResponse?> GetByIdAsync(int id);
    Task<GoodsReceiptResponse> CreateAsync(CreateGoodsReceiptRequest request);
}
