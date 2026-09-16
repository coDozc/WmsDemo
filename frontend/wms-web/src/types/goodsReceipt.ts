export type GoodsReceiptLine = {
  id: number
  productId: number
  productSku: string
  productName: string
  quantity: number
}

export type GoodsReceipt = {
  id: number
  receiptNumber: string
  supplierName: string
  warehouseId: number
  purchaseOrderId: number | null
  purchaseOrderNumber: string | null
  warehouseName: string
  locationId: number
  locationCode: string
  receivedAtUtc: string
  lines: GoodsReceiptLine[]
}

export type CreateGoodsReceiptRequest = {
  supplierName: string
  warehouseId: number
  locationId: number
  purchaseOrderId: number | null
  lines: Array<{ productId: number; quantity: number }>
}
