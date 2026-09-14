import type {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Warehouse,
} from '../types/warehouse'

const baseUrl = '/api/warehouses'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getWarehouses(officeId?: number): Promise<Warehouse[]> {
  const query = officeId ? `?officeId=${officeId}` : ''
  const response = await fetch(`${baseUrl}${query}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Depolar alınamadı.'))
  }

  return response.json()
}

export async function getWarehouseById(id: number): Promise<Warehouse> {
  const response = await fetch(`${baseUrl}/${id}`)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Depo bilgisi alınamadı.'))
  }

  return response.json()
}

export async function createWarehouse(
  officeId: number,
  request: CreateWarehouseRequest,
): Promise<Warehouse> {
  const response = await fetch(`/api/offices/${officeId}/warehouses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Depo oluşturulamadı.'))
  }

  return response.json()
}

export async function updateWarehouse(
  id: number,
  request: UpdateWarehouseRequest,
): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Depo güncellenemedi.'))
  }
}

export async function deactivateWarehouse(id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Depo pasife alınamadı.'))
  }
}
