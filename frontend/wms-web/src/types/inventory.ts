import type { LocationType } from './location'

export type InventoryBalance = {
  id: number
  productId: number
  productSku: string
  productName: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationCode: string
  locationName: string | null
  locationType: LocationType
  quantity: number
  warehouseQuantity: number
  minimumStock: number
  isBelowMinimumStock: boolean
  updatedAtUtc: string
}

export type AdjustStockRequest = {
  productId: number
  locationId: number
  quantityChange: number
  reason: string
}
