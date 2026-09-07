import {
  ArrowRight,
  ArrowRightLeft,
  CircleAlert,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getLocations } from '../api/locationApi'
import { getProducts } from '../api/productApi'
import { createStockTransfer, getStockTransfers } from '../api/stockTransferApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Location } from '../types/location'
import type { Product } from '../types/product'
import type { StockTransfer } from '../types/stockTransfer'

type TransferFormState = {
  fromLocationId: string
  toLocationId: string
  lines: Array<{ productId: string; quantity: number }>
}

const emptyForm: TransferFormState = {
  fromLocationId: '',
  toLocationId: '',
  lines: [{ productId: '', quantity: 1 }],
}

function locationLabel(location: Location) {
  return `${location.warehouseName} · ${location.code}`
}

function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<TransferFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadTransfers() {
    setLoading(true)
    setError(null)
    try {
      setTransfers(await getStockTransfers())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Transferler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)
      try {
        const [transferResult, productResult, warehouseResult] = await Promise.all([
          getStockTransfers(),
          getProducts(),
          getWarehouses(),
        ])
        const locationGroups = await Promise.all(
          warehouseResult.filter((warehouse) => warehouse.isActive).map((warehouse) => getLocations(warehouse.id)),
        )
        setTransfers(transferResult)
        setProducts(productResult)
        setLocations(locationGroups.flat().filter((location) => location.isActive))
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Transfer verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }
    void loadInitialData()
  }, [])

  const visibleTransfers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
    if (!normalizedQuery) return transfers
    return transfers.filter((transfer) =>
      transfer.transferNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      transfer.fromWarehouseName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      transfer.toWarehouseName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      transfer.fromLocationCode.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      transfer.toLocationCode.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
    )
  }, [transfers, query])

  const activeProducts = products.filter((product) => product.isActive)
  const targetLocations = locations.filter((location) =>
    location.type !== 'Receiving' && String(location.id) !== form.fromLocationId,
  )

  function openCreateForm() {
    const fromLocation = locations[0]
    const toLocation = locations.find((location) =>
      location.type !== 'Receiving' && location.id !== fromLocation?.id,
    )
    setForm({
      ...emptyForm,
      fromLocationId: fromLocation ? String(fromLocation.id) : '',
      toLocationId: toLocation ? String(toLocation.id) : '',
      lines: [{ productId: '', quantity: 1 }],
    })
    setFormError(null)
    setFormOpen(true)
  }

  function changeSourceLocation(value: string) {
    const nextTargets = locations.filter((location) =>
      location.type !== 'Receiving' && String(location.id) !== value,
    )
    const currentTargetIsValid = nextTargets.some((location) => String(location.id) === form.toLocationId)
    setForm({
      ...form,
      fromLocationId: value,
      toLocationId: currentTargetIsValid ? form.toLocationId : String(nextTargets[0]?.id ?? ''),
    })
  }

  function updateLine(index: number, change: Partial<TransferFormState['lines'][number]>) {
    setForm({
      ...form,
      lines: form.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...change } : line),
    })
  }

  function removeLine(index: number) {
    if (form.lines.length === 1) return
    setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const lines = form.lines.map((line) => ({
        productId: Number(line.productId),
        quantity: line.quantity,
      }))
      const productIds = lines.map((line) => line.productId)
      if (productIds.some((id) => id === 0)) throw new Error('Her satır için ürün seçmelisiniz.')
      if (new Set(productIds).size !== productIds.length) throw new Error('Aynı ürün birden fazla satırda bulunamaz.')

      await createStockTransfer({
        fromLocationId: Number(form.fromLocationId),
        toLocationId: Number(form.toLocationId),
        lines,
      })
      setFormOpen(false)
      await loadTransfers()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Transfer tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  return <section>
    <div className="page-toolbar receipts-toolbar">
      <div className="search-control"><Search size={18} aria-hidden="true" /><input className="form-control" type="search" placeholder="Transfer no, depo veya lokasyon ara" aria-label="Transferlerde ara" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadTransfers()} disabled={loading}><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>
      <button type="button" className="btn btn-dark add-button" onClick={openCreateForm} disabled={activeProducts.length === 0 || locations.length < 2}><Plus size={18} /> Yeni Transfer</button>
    </div>
    <div className="list-meta"><span>{visibleTransfers.length} transfer</span><span className="list-meta-separator" /><span>{visibleTransfers.reduce((total, transfer) => total + transfer.lines.reduce((sum, line) => sum + line.quantity, 0), 0)} toplam adet</span></div>
    {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}
    <div className="table-shell">
      <div className="table-responsive"><table className="table products-table operation-table mb-0 align-middle"><thead><tr><th>Transfer No</th><th>Kaynak</th><th></th><th>Hedef</th><th>Ürün / Miktar</th><th>Transfer Zamanı</th><th className="text-end">Detay</th></tr></thead><tbody>
        {!loading && visibleTransfers.map((transfer) => <tr key={transfer.id}><td><span className="sku-text">{transfer.transferNumber}</span></td><td><strong>{transfer.fromWarehouseName}</strong><span className="cell-subtext">{transfer.fromLocationCode}</span></td><td><ArrowRight size={16} className="movement-in" /></td><td><strong>{transfer.toWarehouseName}</strong><span className="cell-subtext">{transfer.toLocationCode}</span></td><td><strong>{transfer.lines.length}</strong> kalem<span className="cell-subtext">{transfer.lines.reduce((sum, line) => sum + line.quantity, 0)} toplam adet</span></td><td>{new Date(transfer.transferredAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><div className="row-actions"><button type="button" className="icon-button" title="Transfer detayını görüntüle" aria-label={`${transfer.transferNumber} detayını görüntüle`} onClick={() => setSelectedTransfer(transfer)}><Eye size={17} /></button></div></td></tr>)}
      </tbody></table></div>
      {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Transferler yükleniyor</span></div>}
      {!loading && visibleTransfers.length === 0 && <div className="table-state"><ArrowRightLeft size={28} /><strong>Transfer bulunamadı</strong><span>Lokasyonlar arasında ilk stok transferini oluşturun.</span></div>}
    </div>

    {formOpen && <div className="dialog-backdrop" role="presentation"><div className="product-dialog order-dialog" role="dialog" aria-modal="true" aria-labelledby="transfer-dialog-title">
      <div className="dialog-header"><div><span className="dialog-kicker">İç hareket</span><h2 id="transfer-dialog-title">Yeni Transfer</h2></div><button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button></div>
      <form onSubmit={handleSubmit}><div className="dialog-body">{formError && <div className="alert alert-danger py-2">{formError}</div>}
        <div className="order-form-grid">
          <div><label className="form-label" htmlFor="transfer-source">Kaynak lokasyon</label><select id="transfer-source" className="form-select" required value={form.fromLocationId} onChange={(event) => changeSourceLocation(event.target.value)}><option value="">Kaynak seçin</option>{locations.map((location) => <option key={location.id} value={location.id}>{locationLabel(location)} · {location.type}</option>)}</select></div>
          <div><label className="form-label" htmlFor="transfer-target">Hedef lokasyon</label><select id="transfer-target" className="form-select" required value={form.toLocationId} onChange={(event) => setForm({ ...form, toLocationId: event.target.value })}><option value="">Hedef seçin</option>{targetLocations.map((location) => <option key={location.id} value={location.id}>{locationLabel(location)} · {location.type}</option>)}</select></div>
        </div>
        <div className="order-lines-header"><strong>Transfer Edilecek Ürünler</strong><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setForm({ ...form, lines: [...form.lines, { productId: '', quantity: 1 }] })}><Plus size={16} /> Satır Ekle</button></div>
        <div className="order-lines">{form.lines.map((line, index) => <div className="order-line" key={index}><div><label className="form-label" htmlFor={`transfer-product-${index}`}>Ürün</label><select id={`transfer-product-${index}`} className="form-select" required value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}><option value="">Ürün seçin</option>{activeProducts.map((product) => <option key={product.id} value={product.id} disabled={form.lines.some((otherLine, otherIndex) => otherIndex !== index && otherLine.productId === String(product.id))}>{product.sku} · {product.name}</option>)}</select></div><div><label className="form-label" htmlFor={`transfer-quantity-${index}`}>Miktar</label><input id={`transfer-quantity-${index}`} className="form-control" type="number" min={1} step={1} required value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></div><button type="button" className="icon-button danger order-line-remove" title="Satırı kaldır" aria-label={`${index + 1}. satırı kaldır`} disabled={form.lines.length === 1} onClick={() => removeLine(index)}><Trash2 size={17} /></button></div>)}</div>
      </div><div className="dialog-footer"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button><button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Aktarılıyor...' : 'Transferi Tamamla'}</button></div></form>
    </div></div>}

    {selectedTransfer && <div className="dialog-backdrop" role="presentation"><div className="product-dialog receipt-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="transfer-detail-title"><div className="dialog-header"><div><span className="dialog-kicker">Transfer detayı</span><h2 id="transfer-detail-title">{selectedTransfer.transferNumber}</h2></div><button type="button" className="icon-button" title="Detayı kapat" aria-label="Detayı kapat" onClick={() => setSelectedTransfer(null)}><X size={20} /></button></div><div className="dialog-body"><dl className="receipt-summary"><div><dt>Kaynak</dt><dd>{selectedTransfer.fromWarehouseName} · {selectedTransfer.fromLocationCode}</dd></div><div><dt>Hedef</dt><dd>{selectedTransfer.toWarehouseName} · {selectedTransfer.toLocationCode}</dd></div></dl><div className="receipt-detail-lines">{selectedTransfer.lines.map((line) => <div key={line.id}><span><strong>{line.productName}</strong><small>{line.productSku}</small></span><strong>{line.quantity} adet</strong></div>)}</div></div><div className="dialog-footer"><button type="button" className="btn btn-dark" onClick={() => setSelectedTransfer(null)}>Kapat</button></div></div></div>}
  </section>
}

export default StockTransfersPage
