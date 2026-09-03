import type { CreateShipmentRequest, Shipment } from '../types/shipment'

const baseUrl = '/api/shipments'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getShipments(): Promise<Shipment[]> {
  const response = await fetch(baseUrl)
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Sevkiyatlar alınamadı.'))
  return response.json()
}

export async function createShipment(request: CreateShipmentRequest): Promise<Shipment> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Sevkiyat tamamlanamadı.'))
  return response.json()
}
