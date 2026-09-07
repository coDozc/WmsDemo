export type StockTransferLine = {
  id: number
  productId: number
  productSku: string
  productName: string
  quantity: number
}

export type StockTransfer = {
  id: number
  transferNumber: string
  fromLocationId: number
  fromLocationCode: string
  fromWarehouseName: string
  toLocationId: number
  toLocationCode: string
  toWarehouseName: string
  transferredAtUtc: string
  lines: StockTransferLine[]
}

export type CreateStockTransferRequest = {
  fromLocationId: number
  toLocationId: number
  lines: Array<{ productId: number; quantity: number }>
}
