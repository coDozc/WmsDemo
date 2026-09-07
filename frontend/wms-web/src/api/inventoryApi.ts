import type {
  AdjustStockRequest,
  InventoryBalance,
} from '../types/inventory'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

type InventoryFilters = {
  warehouseId?: number
  locationId?: number
  productId?: number
  includeZero?: boolean
}

export async function getInventory(
  filters: InventoryFilters = {},
): Promise<InventoryBalance[]> {
  const query = new URLSearchParams()

  if (filters.warehouseId) query.set('warehouseId', String(filters.warehouseId))
  if (filters.locationId) query.set('locationId', String(filters.locationId))
  if (filters.productId) query.set('productId', String(filters.productId))
  if (filters.includeZero) query.set('includeZero', 'true')

  const url = query.size > 0 ? `/api/inventory?${query}` : '/api/inventory'
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Stoklar alınamadı.'))
  }

  return response.json()
}

export async function adjustStock(
  request: AdjustStockRequest,
): Promise<InventoryBalance> {
  const response = await fetch('/api/inventory/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Stok güncellenemedi.'))
  }

  return response.json()
}
