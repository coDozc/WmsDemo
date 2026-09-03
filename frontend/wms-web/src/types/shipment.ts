export type ShipmentLine = {
  id: number
  productId: number
  productSku: string
  productName: string
  quantity: number
}

export type Shipment = {
  id: number
  shipmentNumber: string
  carrierName: string
  orderId: number
  orderNumber: string
  customerName: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationCode: string
  shippedAtUtc: string
  lines: ShipmentLine[]
}

export type CreateShipmentRequest = {
  shipmentNumber: string
  carrierName: string
  orderId: number
  locationId: number
}
