export type PurchaseOrderStatus =
  | 'Draft'
  | 'Approved'
  | 'PartiallyReceived'
  | 'Completed'
  | 'Cancelled'

export type PurchaseOrderLine = {
  id: number
  productId: number
  productSku: string
  productName: string
  orderedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
}

export type PurchaseOrder = {
  id: number
  orderNumber: string
  warehouseId: number
  warehouseName: string
  supplierName: string
  status: PurchaseOrderStatus
  isActive: boolean
  createdAtUtc: string
  receivedAtUtc: string | null
  completedAtUtc: string | null
  lines: PurchaseOrderLine[]
}

export type PurchaseOrderLineRequest = {
  productId: number
  quantity: number
}

export type SavePurchaseOrderRequest = {
  warehouseId: number
  supplierName: string
  lines: PurchaseOrderLineRequest[]
}
