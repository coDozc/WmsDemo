namespace Wms.Api.Services;

public interface IDocumentNumberService
{
    Task<string> CreateAsync(string documentType);
}
