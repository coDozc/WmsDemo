import type {
  PurchaseOrder,
  SavePurchaseOrderRequest,
} from '../types/purchaseOrder'

const baseUrl = '/api/purchase-orders'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const response = await fetch(baseUrl)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Satın alma siparişleri alınamadı.'))
  }

  return response.json()
}

export async function createPurchaseOrder(
  request: SavePurchaseOrderRequest,
): Promise<PurchaseOrder> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Satın alma siparişi oluşturulamadı.'))
  }

  return response.json()
}

export async function updatePurchaseOrder(
  id: number,
  request: SavePurchaseOrderRequest,
): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Satın alma siparişi güncellenemedi.'))
  }
}

export async function approvePurchaseOrder(id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}/approve`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Satın alma siparişi onaylanamadı.'))
  }
}

export async function cancelPurchaseOrder(id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}/cancel`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Satın alma siparişi iptal edilemedi.'))
  }
}
