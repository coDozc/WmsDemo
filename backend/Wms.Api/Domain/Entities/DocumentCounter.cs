namespace Wms.Api.Domain.Entities;

public class DocumentCounter
{
    public int Id { get; set; }
    public required string DocumentType { get; set; }
    public int Year { get; set; }
    public int LastNumber { get; set; }
}
