import type {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '../types/product'

const baseUrl = '/api/products'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(baseUrl)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ürünler alınamadı.'))
  }

  return response.json()
}

export async function createProduct(
  request: CreateProductRequest,
): Promise<Product> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ürün oluşturulamadı.'))
  }

  return response.json()
}

export async function updateProduct(
  id: number,
  request: UpdateProductRequest,
): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ürün güncellenemedi.'))
  }
}

export async function deactivateProduct(id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Ürün pasife alınamadı.'))
  }
}
