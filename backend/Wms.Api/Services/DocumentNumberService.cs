using System.Data;
using Microsoft.EntityFrameworkCore;
using Wms.Api.Data;
using Wms.Api.Domain.Entities;

namespace Wms.Api.Services;

public class DocumentNumberService(WmsDbContext dbContext)
    : IDocumentNumberService
{
    public async Task<string> CreateAsync(string documentType)
    {
        var normalizedType = documentType.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(normalizedType))
        {
            throw new ArgumentException(
                "Belge türü boş olamaz.",
                nameof(documentType));
        }

        if (normalizedType.Length > 10)
        {
            throw new ArgumentException(
                "Belge türü en fazla 10 karakter olabilir.",
                nameof(documentType));
        }

        var year = DateTime.UtcNow.Year;

        await using var transaction = await dbContext.Database
            .BeginTransactionAsync(IsolationLevel.Serializable);

        var counter = await dbContext.DocumentCounters
            .FromSqlInterpolated($"""
                SELECT *
                FROM [DocumentCounters] WITH (UPDLOCK, HOLDLOCK)
                WHERE [DocumentType] = {normalizedType}
                  AND [Year] = {year}
                """)
            .SingleOrDefaultAsync();

        if (counter is null)
        {
            counter = new DocumentCounter
            {
                DocumentType = normalizedType,
                Year = year,
                LastNumber = 1
            };

            dbContext.DocumentCounters.Add(counter);
        }
        else
        {
            counter.LastNumber = checked(counter.LastNumber + 1);
        }

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return $"{normalizedType}-{year}-{counter.LastNumber:D6}";
    }
}
