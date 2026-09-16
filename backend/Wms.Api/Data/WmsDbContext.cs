using Microsoft.EntityFrameworkCore;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Data;

public class WmsDbContext(DbContextOptions<WmsDbContext> options)
    : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<InventoryBalance> InventoryBalances => Set<InventoryBalance>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GoodsReceiptLine> GoodsReceiptLines => Set<GoodsReceiptLine>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferLine> StockTransferLines => Set<StockTransferLine>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentLine> ShipmentLines => Set<ShipmentLine>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderLine> PurchaseOrderLines => Set<PurchaseOrderLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_Products_MinimumStock",
                "[MinimumStock] >= 0"));

            entity.HasKey(product => product.Id);

            entity.Property(product => product.Sku)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(product => product.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(product => product.Barcode)
                .HasMaxLength(100);

            entity.HasIndex(product => product.Sku)
                .IsUnique();

            entity.HasIndex(product => product.Barcode)
                .IsUnique()
                .HasFilter("[Barcode] IS NOT NULL");
        });

        modelBuilder.Entity<Office>(entity =>
        {
            entity.HasKey(office => office.Id);

            entity.Property(office => office.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(office => office.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(office => office.City)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(office => office.District)
                .HasMaxLength(100);

            entity.Property(office => office.Type)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(office => office.Code)
                .IsUnique();
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(warehouse => warehouse.Id);

            entity.Property(warehouse => warehouse.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(warehouse => warehouse.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(warehouse => new { warehouse.OfficeId, warehouse.Code })
                .IsUnique();

            entity.HasOne(warehouse => warehouse.Office)
                .WithMany(office => office.Warehouses)
                .HasForeignKey(warehouse => warehouse.OfficeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(location => location.Id);

            entity.Property(location => location.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(location => location.Name)
                .HasMaxLength(200);

            entity.Property(location => location.Type)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(location => new { location.WarehouseId, location.Code })
                .IsUnique();

            entity.HasOne(location => location.Warehouse)
                .WithMany(warehouse => warehouse.Locations)
                .HasForeignKey(location => location.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryBalance>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_InventoryBalances_Quantity",
                "[Quantity] >= 0"));

            entity.HasKey(balance => balance.Id);

            entity.HasIndex(balance => new
                { balance.ProductId, balance.LocationId })
                .IsUnique();

            entity.HasOne(balance => balance.Product)
                .WithMany()
                .HasForeignKey(balance => balance.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(balance => balance.Location)
                .WithMany()
                .HasForeignKey(balance => balance.LocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_StockMovements_Quantity",
                "[Quantity] > 0"));

            entity.HasKey(movement => movement.Id);

            entity.Property(movement => movement.Type)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(movement => movement.Note)
                .HasMaxLength(250)
                .IsRequired();

            entity.HasIndex(movement => movement.CreatedAtUtc);

            entity.HasOne(movement => movement.Product)
                .WithMany()
                .HasForeignKey(movement => movement.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(movement => movement.FromLocation)
                .WithMany()
                .HasForeignKey(movement => movement.FromLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(movement => movement.ToLocation)
                .WithMany()
                .HasForeignKey(movement => movement.ToLocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(order => order.Id);

            entity.Property(order => order.OrderNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(order => order.CustomerName)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(order => order.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(order => order.OrderNumber)
                .IsUnique();

            entity.HasOne(order => order.Warehouse)
                .WithMany()
                .HasForeignKey(order => order.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(order => order.Lines)
                .WithOne(line => line.Order)
                .HasForeignKey(line => line.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderLine>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_OrderLines_Quantity",
                "[Quantity] > 0"));

            entity.HasKey(line => line.Id);

            entity.HasOne(line => line.Product)
                .WithMany()
                .HasForeignKey(line => line.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoodsReceipt>(entity =>
        {
            entity.HasKey(receipt => receipt.Id);

            entity.Property(receipt => receipt.ReceiptNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(receipt => receipt.SupplierName)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(receipt => receipt.ReceiptNumber)
                .IsUnique();

            entity.HasOne(receipt => receipt.Warehouse)
                .WithMany()
                .HasForeignKey(receipt => receipt.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(receipt => receipt.Location)
                .WithMany()
                .HasForeignKey(receipt => receipt.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(receipt => receipt.PurchaseOrder)
                .WithMany()
                .HasForeignKey(receipt => receipt.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(receipt => receipt.Lines)
                .WithOne(line => line.GoodsReceipt)
                .HasForeignKey(line => line.GoodsReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GoodsReceiptLine>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_GoodsReceiptLines_Quantity",
                "[Quantity] > 0"));

            entity.HasKey(line => line.Id);

            entity.HasOne(line => line.Product)
                .WithMany()
                .HasForeignKey(line => line.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StockTransfer>(entity =>
        {
            entity.HasKey(transfer => transfer.Id);

            entity.Property(transfer => transfer.TransferNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(transfer => transfer.TransferNumber)
                .IsUnique();

            entity.HasOne(transfer => transfer.FromLocation)
                .WithMany()
                .HasForeignKey(transfer => transfer.FromLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(transfer => transfer.ToLocation)
                .WithMany()
                .HasForeignKey(transfer => transfer.ToLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(transfer => transfer.Lines)
                .WithOne(line => line.StockTransfer)
                .HasForeignKey(line => line.StockTransferId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StockTransferLine>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_StockTransferLines_Quantity",
                "[Quantity] > 0"));

            entity.HasKey(line => line.Id);

            entity.HasIndex(line => new { line.StockTransferId, line.ProductId })
                .IsUnique();

            entity.HasOne(line => line.Product)
                .WithMany()
                .HasForeignKey(line => line.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(shipment => shipment.Id);

            entity.Property(shipment => shipment.ShipmentNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(shipment => shipment.CarrierName)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(shipment => shipment.ShipmentNumber)
                .IsUnique();

            entity.HasIndex(shipment => shipment.OrderId)
                .IsUnique();

            entity.HasOne(shipment => shipment.Order)
                .WithMany()
                .HasForeignKey(shipment => shipment.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(shipment => shipment.Location)
                .WithMany()
                .HasForeignKey(shipment => shipment.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(shipment => shipment.Lines)
                .WithOne(line => line.Shipment)
                .HasForeignKey(line => line.ShipmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShipmentLine>(entity =>
        {
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_ShipmentLines_Quantity",
                "[Quantity] > 0"));

            entity.HasKey(line => line.Id);

            entity.HasIndex(line => new { line.ShipmentId, line.ProductId })
                .IsUnique();

            entity.HasOne(line => line.Product)
                .WithMany()
                .HasForeignKey(line => line.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.HasKey(po => po.Id);

            entity.Property(po => po.OrderNumber)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(po => po.SupplierName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(po => po.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(po => po.OrderNumber)
                .IsUnique();

            entity.HasOne(po => po.Warehouse)
                .WithMany()
                .HasForeignKey(po => po.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(po => po.Lines)
                .WithOne(line => line.PurchaseOrder)
                .HasForeignKey(line => line.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PurchaseOrderLine>(entity =>
        {
            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_PurchaseOrderLines_OrderedQuantity",
                    "[OrderedQuantity] > 0");
                table.HasCheckConstraint(
                    "CK_PurchaseOrderLines_ReceivedQuantity",
                    "[ReceivedQuantity] >= 0 AND [ReceivedQuantity] <= [OrderedQuantity]");
            });

            entity.HasKey(line => line.Id);

            entity.HasIndex(line => new { line.PurchaseOrderId, line.ProductId })
                .IsUnique();

            entity.HasOne(line => line.Product)
                .WithMany()
                .HasForeignKey(line => line.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
