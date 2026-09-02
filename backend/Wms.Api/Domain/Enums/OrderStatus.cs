namespace Wms.Api.Domain.Enums;

public enum OrderStatus
{
    Draft = 1,
    ReadyToPick = 2,
    Picking = 3,
    Shipping = 4,
    Completed = 5,
    Cancelled = 6,
}