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

export async function getInventory(): Promise<InventoryBalance[]> {
  const response = await fetch('/api/inventory')

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
