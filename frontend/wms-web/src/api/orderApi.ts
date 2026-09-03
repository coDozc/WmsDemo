import type { Order, SaveOrderRequest } from '../types/order'

const baseUrl = '/api/orders'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(baseUrl)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Siparişler alınamadı.'))
  }

  return response.json()
}

export async function createOrder(request: SaveOrderRequest): Promise<Order> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Sipariş oluşturulamadı.'))
  }

  return response.json()
}

export async function updateOrder(id: number, request: SaveOrderRequest): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Sipariş güncellenemedi.'))
  }
}

export async function cancelOrder(id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}/cancel`, { method: 'POST' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Sipariş iptal edilemedi.'))
  }
}
