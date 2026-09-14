import type { CreateOfficeRequest, Office } from '../types/office'

const baseUrl = '/api/offices'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getOffices(): Promise<Office[]> {
  const response = await fetch(baseUrl)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ofisler alınamadı.'))
  }

  return response.json()
}

export async function createOffice(
  request: CreateOfficeRequest,
): Promise<Office> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ofis oluşturulamadı.'))
  }

  return response.json()
}

export async function getOfficeById(id: number): Promise<Office> {
  const response = await fetch(`${baseUrl}/${id}`)

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Ofis bilgisi alınamadı.'),
    )
  }

  return response.json()
}
