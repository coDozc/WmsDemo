import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CircleAlert,
  ClipboardList,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getStockMovements } from '../api/stockMovementApi'
import type {
  StockMovement,
  StockMovementType,
} from '../types/stockMovement'

type MovementFilter = 'all' | StockMovementType

const movementLabels: Record<StockMovementType, string> = {
  Adjustment: 'Düzeltme',
  Receipt: 'Mal kabul',
  Transfer: 'Transfer',
  Shipment: 'Sevkiyat',
}

function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MovementFilter>('all')

  async function loadMovements(type: MovementFilter = typeFilter) {
    setLoading(true)
    setError(null)

    try {
      setMovements(await getStockMovements(type === 'all' ? undefined : type))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Stok hareketleri alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialMovements() {
      await loadMovements('all')
    }

    void loadInitialMovements()
  }, [])

  const visibleMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    if (!normalizedQuery) return movements

    return movements.filter((movement) =>
      movement.productName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      movement.productSku.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      movement.fromLocationCode?.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      movement.toLocationCode?.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      movement.note.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
    )
  }, [movements, query])

  async function changeTypeFilter(value: MovementFilter) {
    setTypeFilter(value)
    await loadMovements(value)
  }

  function locationText(warehouse: string | null, location: string | null) {
    if (!location) return null
    return warehouse ? `${warehouse} · ${location}` : location
  }

  return (
    <section>
      <div className="page-toolbar movements-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input type="search" className="form-control" placeholder="Ürün, lokasyon veya açıklama ara" aria-label="Stok hareketlerinde ara" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        <select className="form-select" aria-label="Hareket tipine göre filtrele" value={typeFilter} onChange={(event) => void changeTypeFilter(event.target.value as MovementFilter)}>
          <option value="all">Tüm hareketler</option>
          <option value="Adjustment">Düzeltme</option>
          <option value="Receipt">Mal kabul</option>
          <option value="Transfer">Transfer</option>
          <option value="Shipment">Sevkiyat</option>
        </select>

        <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadMovements()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleMovements.length} hareket</span>
        <span className="list-meta-separator" />
        <span>{visibleMovements.reduce((total, movement) => total + movement.quantity, 0)} toplam miktar</span>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table movements-table mb-0 align-middle">
            <thead><tr><th>Zaman</th><th>Ürün</th><th>Tip</th><th>Hareket</th><th className="text-end">Miktar</th><th>Açıklama</th></tr></thead>
            <tbody>
              {!loading && visibleMovements.map((movement) => {
                const source = locationText(movement.fromWarehouseName, movement.fromLocationCode)
                const target = locationText(movement.toWarehouseName, movement.toLocationCode)
                const isInbound = !source && Boolean(target)

                return (
                  <tr key={movement.id}>
                    <td>{new Date(movement.createdAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><span className="product-name d-block">{movement.productName}</span><span className="sku-text">{movement.productSku}</span></td>
                    <td><span className={`movement-badge ${movement.type.toLowerCase()}`}>{movementLabels[movement.type]}</span></td>
                    <td>
                      <div className="movement-path">
                        {isInbound ? <ArrowDownToLine size={16} className="movement-in" /> : <ArrowUpFromLine size={16} className="movement-out" />}
                        <span>{source ?? 'Dış kaynak'}</span>
                        <ArrowRight size={14} />
                        <span>{target ?? 'Çıkış'}</span>
                      </div>
                    </td>
                    <td className="text-end"><strong>{movement.quantity}</strong></td>
                    <td className="movement-note">{movement.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Hareketler yükleniyor</span></div>}
        {!loading && visibleMovements.length === 0 && <div className="table-state"><ClipboardList size={28} /><strong>Stok hareketi bulunamadı</strong><span>Stok düzeltmeleri ve operasyonlar burada görüntülenecek.</span></div>}
      </div>
    </section>
  )
}

export default StockMovementsPage
