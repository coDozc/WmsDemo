using Microsoft.EntityFrameworkCore;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Persistence;

public class WmsDbContext(DbContextOptions<WmsDbContext> options)
    : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Sku)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Barcode)
                .HasMaxLength(100);

            entity.HasIndex(x => x.Sku)
                .IsUnique();
        });
    }
}