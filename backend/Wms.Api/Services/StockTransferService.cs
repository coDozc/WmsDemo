using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.StockTransfers;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class StockTransferService(WmsDbContext dbContext)
    : IStockTransferService
{
    public async Task<IReadOnlyList<StockTransferResponse>> GetAllAsync()
    {
        var transfers = await TransferQuery()
            .OrderByDescending(transfer => transfer.TransferredAtUtc)
            .ToListAsync();

        return transfers.Select(MapToResponse).ToList();
    }

    public async Task<StockTransferResponse?> GetByIdAsync(int id)
    {
        var transfer = await TransferQuery()
            .FirstOrDefaultAsync(item => item.Id == id);

        return transfer is null ? null : MapToResponse(transfer);
    }

    public async Task<StockTransferResponse> CreateAsync(
        CreateStockTransferRequest request)
    {
        var transferNumber = request.TransferNumber.Trim().ToUpperInvariant();

        if (request.FromLocationId == request.ToLocationId)
        {
            throw new InvalidOperationException(
                "Kaynak ve hedef lokasyon aynı olamaz.");
        }

        if (await dbContext.StockTransfers.AnyAsync(transfer =>
                transfer.TransferNumber == transferNumber))
        {
            throw new InvalidOperationException(
                "Bu transfer numarası daha önce kullanılmış.");
        }

        var locations = await dbContext.Locations
            .Include(location => location.Warehouse)
            .Where(location =>
                location.Id == request.FromLocationId ||
                location.Id == request.ToLocationId)
            .ToDictionaryAsync(location => location.Id);

        if (!locations.TryGetValue(request.FromLocationId, out var fromLocation) ||
            !locations.TryGetValue(request.ToLocationId, out var toLocation))
        {
            throw new KeyNotFoundException("Kaynak veya hedef lokasyon bulunamadı.");
        }

        if (!fromLocation.IsActive || !fromLocation.Warehouse.IsActive ||
            !toLocation.IsActive || !toLocation.Warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo veya lokasyonda transfer yapılamaz.");
        }

        if (toLocation.Type == LocationType.Receiving)
        {
            throw new InvalidOperationException(
                "Transfer hedefi Storage veya Shipping tipinde olmalıdır.");
        }

        var productIds = request.Lines.Select(line => line.ProductId).ToList();

        if (productIds.Distinct().Count() != productIds.Count)
        {
            throw new InvalidOperationException(
                "Aynı ürün transferde birden fazla satırda bulunamaz.");
        }

        var activeProductCount = await dbContext.Products.CountAsync(product =>
            productIds.Contains(product.Id) && product.IsActive);

        if (activeProductCount != productIds.Count)
        {
            throw new KeyNotFoundException(
                "Ürünlerden biri bulunamadı veya pasif durumda.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var sourceBalances = await dbContext.InventoryBalances
            .Where(balance =>
                balance.LocationId == request.FromLocationId &&
                productIds.Contains(balance.ProductId))
            .ToDictionaryAsync(balance => balance.ProductId);

        var targetBalances = await dbContext.InventoryBalances
            .Where(balance =>
                balance.LocationId == request.ToLocationId &&
                productIds.Contains(balance.ProductId))
            .ToDictionaryAsync(balance => balance.ProductId);

        var transfer = new StockTransfer
        {
            TransferNumber = transferNumber,
            FromLocationId = request.FromLocationId,
            ToLocationId = request.ToLocationId,
            Lines = request.Lines.Select(line => new StockTransferLine
            {
                ProductId = line.ProductId,
                Quantity = line.Quantity
            }).ToList()
        };

        dbContext.StockTransfers.Add(transfer);

        foreach (var line in request.Lines)
        {
            if (!sourceBalances.TryGetValue(line.ProductId, out var sourceBalance) ||
                sourceBalance.Quantity < line.Quantity)
            {
                throw new InvalidOperationException(
                    $"{line.ProductId} numaralı ürün için kaynak stok yetersiz.");
            }

            sourceBalance.Quantity -= line.Quantity;
            sourceBalance.UpdatedAtUtc = DateTime.UtcNow;

            if (!targetBalances.TryGetValue(line.ProductId, out var targetBalance))
            {
                targetBalance = new InventoryBalance
                {
                    ProductId = line.ProductId,
                    LocationId = request.ToLocationId,
                    Quantity = line.Quantity
                };
                dbContext.InventoryBalances.Add(targetBalance);
            }
            else
            {
                var newQuantity = (long)targetBalance.Quantity + line.Quantity;

                if (newQuantity > int.MaxValue)
                {
                    throw new InvalidOperationException(
                        "Hedef stok miktarı izin verilen üst sınırı aşıyor.");
                }

                targetBalance.Quantity = (int)newQuantity;
                targetBalance.UpdatedAtUtc = DateTime.UtcNow;
            }

            dbContext.StockMovements.Add(new StockMovement
            {
                ProductId = line.ProductId,
                FromLocationId = request.FromLocationId,
                ToLocationId = request.ToLocationId,
                Quantity = line.Quantity,
                Type = StockMovementType.Transfer,
                Note = $"Transfer {transferNumber}"
            });
        }

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetByIdAsync(transfer.Id)
            ?? throw new InvalidOperationException(
                "Transfer kaydedildi ancak okunamadı.");
    }

    private IQueryable<StockTransfer> TransferQuery()
    {
        return dbContext.StockTransfers
            .AsNoTracking()
            .Include(transfer => transfer.FromLocation)
                .ThenInclude(location => location.Warehouse)
            .Include(transfer => transfer.ToLocation)
                .ThenInclude(location => location.Warehouse)
            .Include(transfer => transfer.Lines)
                .ThenInclude(line => line.Product);
    }

    private static StockTransferResponse MapToResponse(StockTransfer transfer)
    {
        return new StockTransferResponse
        {
            Id = transfer.Id,
            TransferNumber = transfer.TransferNumber,
            FromLocationId = transfer.FromLocationId,
            FromLocationCode = transfer.FromLocation.Code,
            FromWarehouseName = transfer.FromLocation.Warehouse.Name,
            ToLocationId = transfer.ToLocationId,
            ToLocationCode = transfer.ToLocation.Code,
            ToWarehouseName = transfer.ToLocation.Warehouse.Name,
            TransferredAtUtc = transfer.TransferredAtUtc,
            Lines = transfer.Lines
                .OrderBy(line => line.Product.Name)
                .Select(line => new StockTransferLineResponse
                {
                    Id = line.Id,
                    ProductId = line.ProductId,
                    ProductSku = line.Product.Sku,
                    ProductName = line.Product.Name,
                    Quantity = line.Quantity
                })
                .ToList()
        };
    }
}
