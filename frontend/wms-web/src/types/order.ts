export type OrderStatus =
  | 'Draft'
  | 'ReadyToPick'
  | 'Picking'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled'

export type OrderLine = {
  id: number
  productId: number
  productSku: string
  productName: string
  quantity: number
}

export type Order = {
  id: number
  orderNumber: string
  warehouseId: number
  warehouseName: string
  customerName: string
  status: OrderStatus
  isActive: boolean
  createdAtUtc: string
  shippedAtUtc: string | null
  lines: OrderLine[]
}

export type OrderLineRequest = {
  productId: number
  quantity: number
}

export type SaveOrderRequest = {
  warehouseId: number
  customerName: string
  lines: OrderLineRequest[]
}
