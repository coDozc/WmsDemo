export type OfficeType = 'Headquarters' | 'Regional' | 'Branch'

export type Office = {
  id: number
  code: string
  name: string
  city: string
  district: string | null
  type: OfficeType
  isActive: boolean
  warehouseCount: number
  createdAtUtc: string
}

export type CreateOfficeRequest = {
  code: string
  name: string
  city: string
  district: string
  type: OfficeType
}
