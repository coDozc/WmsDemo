using Microsoft.EntityFrameworkCore;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Data;

public class WmsDbContext(DbContextOptions<WmsDbContext> options)
    : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<InventoryBalance> InventoryBalances => Set<InventoryBalance>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

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

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(warehouse => warehouse.Id);

            entity.Property(warehouse => warehouse.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(warehouse => warehouse.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(warehouse => warehouse.Code)
                .IsUnique();
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
    }
}
