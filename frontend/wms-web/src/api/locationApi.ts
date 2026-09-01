import type {
  CreateLocationRequest,
  Location,
  UpdateLocationRequest,
} from '../types/location'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getLocations(warehouseId: number): Promise<Location[]> {
  const response = await fetch(`/api/warehouses/${warehouseId}/locations`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Lokasyonlar alınamadı.'))
  }

  return response.json()
}

export async function createLocation(
  warehouseId: number,
  request: CreateLocationRequest,
): Promise<Location> {
  const response = await fetch(`/api/warehouses/${warehouseId}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Lokasyon oluşturulamadı.'))
  }

  return response.json()
}

export async function updateLocation(
  id: number,
  request: UpdateLocationRequest,
): Promise<void> {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Lokasyon güncellenemedi.'))
  }
}

export async function deactivateLocation(id: number): Promise<void> {
  const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Lokasyon pasife alınamadı.'))
  }
}
