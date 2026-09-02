import type {
  StockMovement,
  StockMovementType,
} from '../types/stockMovement'

export async function getStockMovements(
  type?: StockMovementType,
): Promise<StockMovement[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  const response = await fetch(`/api/stock-movements${query}`)

  if (!response.ok) {
    throw new Error('Stok hareketleri alınamadı.')
  }

  return response.json()
}
