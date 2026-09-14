import type { StockMovementType } from './stockMovement'

export type WarehouseStockSummary = {
  warehouseId: number
  warehouseCode: string
  warehouseName: string
  totalQuantity: number
  productCount: number
  criticalStockCount: number
}

export type DashboardMovement = {
  id: number
  productSku: string
  productName: string
  type: StockMovementType
  quantity: number
  fromWarehouseName: string | null
  fromLocationCode: string | null
  toWarehouseName: string | null
  toLocationCode: string | null
  note: string
  createdAtUtc: string
}

export type Dashboard = {
  totalStockQuantity: number
  activeProductCount: number
  activeWarehouseCount: number
  activeLocationCount: number
  criticalStockCount: number
  openOrderCount: number
  todayMovementCount: number
  updatedAtUtc: string
  warehouseStocks: WarehouseStockSummary[]
  recentMovements: DashboardMovement[]
}
