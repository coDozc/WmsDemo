using Microsoft.EntityFrameworkCore;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Data;

public class WmsDbContext(DbContextOptions<WmsDbContext> options)
    : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
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
    }
}
