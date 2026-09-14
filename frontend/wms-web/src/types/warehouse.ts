export type Warehouse = {
  id: number
  officeId: number
  officeName: string
  code: string
  name: string
  isActive: boolean
  createdAtUtc: string
}

export type CreateWarehouseRequest = {
  code: string
  name: string
}

export type UpdateWarehouseRequest = {
  code: string
  name: string
  isActive: boolean
}
