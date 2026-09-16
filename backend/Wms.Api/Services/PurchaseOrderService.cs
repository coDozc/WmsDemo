using Microsoft.EntityFrameworkCore;
using Wms.Api.Contracts.PurchaseOrders;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;
using Wms.Api.Domain.Enums;

namespace Wms.Api.Services;

public class PurchaseOrderService(WmsDbContext dbContext) : IPurchaseOrderService
{
    public async Task<IReadOnlyList<PurchaseOrderResponse>> GetAllAsync()
    {
        var purchaseOrders = await dbContext.PurchaseOrders
            .AsNoTracking()
            .Include(purchaseOrder => purchaseOrder.Warehouse)
            .Include(purchaseOrder => purchaseOrder.Lines)
                .ThenInclude(line => line.Product)
            .OrderByDescending(purchaseOrder => purchaseOrder.CreatedAtUtc)
            .ToListAsync();

        return purchaseOrders.Select(MapToResponse).ToList();
    }

    public async Task<PurchaseOrderResponse?> GetByIdAsync(int id)
    {
        var purchaseOrder = await dbContext.PurchaseOrders
            .AsNoTracking()
            .Include(item => item.Warehouse)
            .Include(item => item.Lines)
                .ThenInclude(line => line.Product)
            .FirstOrDefaultAsync(item => item.Id == id);

        return purchaseOrder is null ? null : MapToResponse(purchaseOrder);
    }

    public async Task<PurchaseOrderResponse> CreateAsync(
        CreatePurchaseOrderRequest request)
    {
        await ValidatePurchaseOrderDataAsync(request.WarehouseId, request.Lines);

        var purchaseOrder = new PurchaseOrder
        {
            OrderNumber = DocumentNumberGenerator.Create("SAS"),
            WarehouseId = request.WarehouseId,
            SupplierName = request.SupplierName.Trim(),
            Status = PurchaseOrderStatus.Draft,
            IsActive = true,
            Lines = CreatePurchaseOrderLines(request.Lines)
        };

        dbContext.PurchaseOrders.Add(purchaseOrder);
        await dbContext.SaveChangesAsync();

        return await GetByIdAsync(purchaseOrder.Id)
            ?? throw new InvalidOperationException(
                "Satın alma siparişi oluşturuldu ancak okunamadı.");
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdatePurchaseOrderRequest request)
    {
        var purchaseOrder = await dbContext.PurchaseOrders
            .Include(item => item.Lines)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (purchaseOrder is null)
        {
            return false;
        }

        if (purchaseOrder.Status != PurchaseOrderStatus.Draft)
        {
            throw new InvalidOperationException(
                "Yalnızca taslak satın alma siparişleri güncellenebilir.");
        }

        await ValidatePurchaseOrderDataAsync(request.WarehouseId, request.Lines);

        dbContext.RemoveRange(purchaseOrder.Lines);

        purchaseOrder.WarehouseId = request.WarehouseId;
        purchaseOrder.SupplierName = request.SupplierName.Trim();
        purchaseOrder.Lines = CreatePurchaseOrderLines(request.Lines);

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ApproveAsync(int id)
    {
        var purchaseOrder = await dbContext.PurchaseOrders.FindAsync(id);

        if (purchaseOrder is null)
        {
            return false;
        }

        if (purchaseOrder.Status == PurchaseOrderStatus.Approved)
        {
            return true;
        }

        if (purchaseOrder.Status != PurchaseOrderStatus.Draft)
        {
            throw new InvalidOperationException(
                "Yalnızca taslak satın alma siparişleri onaylanabilir.");
        }

        purchaseOrder.Status = PurchaseOrderStatus.Approved;
        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> CancelAsync(int id)
    {
        var purchaseOrder = await dbContext.PurchaseOrders.FindAsync(id);

        if (purchaseOrder is null)
        {
            return false;
        }

        if (purchaseOrder.Status == PurchaseOrderStatus.Cancelled)
        {
            return true;
        }

        if (purchaseOrder.Status == PurchaseOrderStatus.Completed)
        {
            throw new InvalidOperationException(
                "Tamamlanmış satın alma siparişi iptal edilemez.");
        }

        purchaseOrder.Status = PurchaseOrderStatus.Cancelled;
        purchaseOrder.IsActive = false;

        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task ValidatePurchaseOrderDataAsync(
        int warehouseId,
        IReadOnlyCollection<PurchaseOrderLineRequest> lines)
    {
        var warehouse = await dbContext.Warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == warehouseId);

        if (warehouse is null)
        {
            throw new KeyNotFoundException("Depo bulunamadı.");
        }

        if (!warehouse.IsActive)
        {
            throw new InvalidOperationException(
                "Pasif depo için satın alma siparişi oluşturulamaz.");
        }

        if (lines.Count == 0)
        {
            throw new InvalidOperationException(
                "Satın alma siparişinde en az bir ürün bulunmalıdır.");
        }

        var productIds = lines.Select(line => line.ProductId).ToList();

        if (productIds.Distinct().Count() != productIds.Count)
        {
            throw new InvalidOperationException(
                "Aynı ürün siparişte birden fazla satırda bulunamaz.");
        }

        var activeProductIds = await dbContext.Products
            .AsNoTracking()
            .Where(product =>
                productIds.Contains(product.Id) && product.IsActive)
            .Select(product => product.Id)
            .ToListAsync();

        if (activeProductIds.Count != productIds.Count)
        {
            throw new KeyNotFoundException(
                "Sipariş ürünlerinden biri bulunamadı veya pasif durumda.");
        }
    }

    private static List<PurchaseOrderLine> CreatePurchaseOrderLines(
        IEnumerable<PurchaseOrderLineRequest> requests)
    {
        return requests.Select(request => new PurchaseOrderLine
        {
            ProductId = request.ProductId,
            OrderedQuantity = request.Quantity,
            ReceivedQuantity = 0
        }).ToList();
    }

    private static PurchaseOrderResponse MapToResponse(
        PurchaseOrder purchaseOrder)
    {
        return new PurchaseOrderResponse
        {
            Id = purchaseOrder.Id,
            OrderNumber = purchaseOrder.OrderNumber,
            WarehouseId = purchaseOrder.WarehouseId,
            WarehouseName = purchaseOrder.Warehouse.Name,
            SupplierName = purchaseOrder.SupplierName,
            Status = purchaseOrder.Status.ToString(),
            IsActive = purchaseOrder.IsActive,
            CreatedAtUtc = purchaseOrder.CreatedAtUtc,
            ReceivedAtUtc = purchaseOrder.ReceivedAtUtc,
            CompletedAtUtc = purchaseOrder.Status == PurchaseOrderStatus.Completed
                ? purchaseOrder.ReceivedAtUtc
                : null,
            Lines = purchaseOrder.Lines
                .OrderBy(line => line.Product.Name)
                .Select(line => new PurchaseOrderLineResponse
                {
                    Id = line.Id,
                    ProductId = line.ProductId,
                    ProductSku = line.Product.Sku,
                    ProductName = line.Product.Name,
                    OrderedQuantity = line.OrderedQuantity,
                    ReceivedQuantity = line.ReceivedQuantity,
                    RemainingQuantity = line.OrderedQuantity - line.ReceivedQuantity
                })
                .ToList()
        };
    }
}
