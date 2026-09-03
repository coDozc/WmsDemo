import type { CreateGoodsReceiptRequest, GoodsReceipt } from '../types/goodsReceipt'

const baseUrl = '/api/goods-receipts'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getGoodsReceipts(): Promise<GoodsReceipt[]> {
  const response = await fetch(baseUrl)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Mal kabul kayıtları alınamadı.'))
  }

  return response.json()
}

export async function createGoodsReceipt(
  request: CreateGoodsReceiptRequest,
): Promise<GoodsReceipt> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Mal kabul tamamlanamadı.'))
  }

  return response.json()
}
