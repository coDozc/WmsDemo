export type LocationType = 'Receiving' | 'Storage' | 'Shipping'

export type Location = {
  id: number
  warehouseId: number
  warehouseName: string
  code: string
  name: string | null
  type: LocationType
  isActive: boolean
  createdAtUtc: string
}

export type CreateLocationRequest = {
  code: string
  name: string | null
  type: LocationType
}

export type UpdateLocationRequest = CreateLocationRequest & {
  isActive: boolean
}
