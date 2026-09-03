import type { CreateStockTransferRequest, StockTransfer } from '../types/stockTransfer'

const baseUrl = '/api/stock-transfers'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string; title?: string }
    return body.message ?? body.title ?? fallback
  } catch {
    return fallback
  }
}

export async function getStockTransfers(): Promise<StockTransfer[]> {
  const response = await fetch(baseUrl)
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Transferler alınamadı.'))
  return response.json()
}

export async function createStockTransfer(
  request: CreateStockTransferRequest,
): Promise<StockTransfer> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Transfer tamamlanamadı.'))
  return response.json()
}
