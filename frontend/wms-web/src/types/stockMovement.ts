export type StockMovementType =
  | 'Adjustment'
  | 'Receipt'
  | 'Transfer'
  | 'Shipment'

export type StockMovement = {
  id: number
  productId: number
  productSku: string
  productName: string
  fromLocationId: number | null
  fromLocationCode: string | null
  fromWarehouseName: string | null
  toLocationId: number | null
  toLocationCode: string | null
  toWarehouseName: string | null
  quantity: number
  type: StockMovementType
  note: string
  createdAtUtc: string
}
