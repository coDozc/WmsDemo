namespace Wms.Api.Services;

internal static class DocumentNumberGenerator
{
    // Full random UUID avoids shared counters across concurrent API instances.
    // The longest number is 45 characters, within the existing 50-character columns.
    public static string Create(string prefix)
    {
        return $"{prefix}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}".ToUpperInvariant();
    }
}
