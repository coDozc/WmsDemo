import {
  ArrowDownToLine,
  CircleAlert,
  Eye,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createGoodsReceipt, getGoodsReceipts } from '../api/goodsReceiptApi'
import { getLocations } from '../api/locationApi'
import { getProducts } from '../api/productApi'
import { getWarehouses } from '../api/warehouseApi'
import type { GoodsReceipt } from '../types/goodsReceipt'
import type { Location } from '../types/location'
import type { Product } from '../types/product'
import type { Warehouse } from '../types/warehouse'

type ReceiptFormState = {
  supplierName: string
  warehouseId: string
  locationId: string
  lines: Array<{ productId: string; quantity: number }>
}

const emptyForm: ReceiptFormState = {
  supplierName: '',
  warehouseId: '',
  locationId: '',
  lines: [{ productId: '', quantity: 1 }],
}

function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [receivingLocations, setReceivingLocations] = useState<Location[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ReceiptFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadReceipts() {
    setLoading(true)
    setError(null)

    try {
      setReceipts(await getGoodsReceipts())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Mal kabul kayıtları alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        const [receiptResult, productResult, warehouseResult] = await Promise.all([
          getGoodsReceipts(),
          getProducts(),
          getWarehouses(),
        ])
        setReceipts(receiptResult)
        setProducts(productResult)
        setWarehouses(warehouseResult)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Mal kabul verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  const visibleReceipts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
    if (!normalizedQuery) return receipts

    return receipts.filter((receipt) =>
      receipt.receiptNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      receipt.supplierName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      receipt.warehouseName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      receipt.locationCode.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
    )
  }, [receipts, query])

  const activeProducts = products.filter((product) => product.isActive)
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive)

  async function loadReceivingLocations(warehouseId: number) {
    setLocationsLoading(true)
    setFormError(null)

    try {
      const locations = await getLocations(warehouseId)
      const receiving = locations.filter((location) =>
        location.isActive && location.type === 'Receiving',
      )
      setReceivingLocations(receiving)
      return receiving
    } catch (requestError) {
      setReceivingLocations([])
      setFormError(requestError instanceof Error ? requestError.message : 'Mal kabul lokasyonları alınamadı.')
      return []
    } finally {
      setLocationsLoading(false)
    }
  }

  async function openCreateForm() {
    const firstWarehouse = activeWarehouses[0]
    setForm({
      ...emptyForm,
      warehouseId: firstWarehouse ? String(firstWarehouse.id) : '',
      lines: [{ productId: '', quantity: 1 }],
    })
    setReceivingLocations([])
    setFormError(null)
    setFormOpen(true)

    if (firstWarehouse) {
      const locations = await loadReceivingLocations(firstWarehouse.id)
      setForm((current) => ({
        ...current,
        locationId: locations[0] ? String(locations[0].id) : '',
      }))
    }
  }

  async function changeWarehouse(value: string) {
    setForm({ ...form, warehouseId: value, locationId: '' })
    setReceivingLocations([])
    if (!value) return

    const locations = await loadReceivingLocations(Number(value))
    setForm((current) => ({
      ...current,
      locationId: locations[0] ? String(locations[0].id) : '',
    }))
  }

  function updateLine(index: number, change: Partial<ReceiptFormState['lines'][number]>) {
    setForm({
      ...form,
      lines: form.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...change } : line,
      ),
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

      if (!form.locationId) throw new Error('Receiving tipinde aktif bir lokasyon seçmelisiniz.')
      if (productIds.some((id) => id === 0)) throw new Error('Her satır için ürün seçmelisiniz.')
      if (new Set(productIds).size !== productIds.length) {
        throw new Error('Aynı ürün birden fazla satırda bulunamaz.')
      }

      await createGoodsReceipt({
        supplierName: form.supplierName,
        warehouseId: Number(form.warehouseId),
        locationId: Number(form.locationId),
        lines,
      })

      setFormOpen(false)
      await loadReceipts()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Mal kabul tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="page-toolbar receipts-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input className="form-control" type="search" placeholder="Belge no, tedarikçi, depo veya lokasyon ara" aria-label="Mal kabul kayıtlarında ara" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadReceipts()} disabled={loading}><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>
        <button type="button" className="btn btn-dark add-button" onClick={() => void openCreateForm()} disabled={activeProducts.length === 0 || activeWarehouses.length === 0}><Plus size={18} /> Yeni Mal Kabul</button>
      </div>

      <div className="list-meta">
        <span>{visibleReceipts.length} kayıt</span><span className="list-meta-separator" />
        <span>{visibleReceipts.reduce((total, receipt) => total + receipt.lines.reduce((sum, line) => sum + line.quantity, 0), 0)} toplam adet</span>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table receipts-table mb-0 align-middle">
            <thead><tr><th>Belge No</th><th>Tedarikçi</th><th>Depo</th><th>Mal Kabul Lokasyonu</th><th>Ürün / Miktar</th><th>Kabul Zamanı</th><th className="text-end">Detay</th></tr></thead>
            <tbody>{!loading && visibleReceipts.map((receipt) => {
              const totalQuantity = receipt.lines.reduce((sum, line) => sum + line.quantity, 0)
              return <tr key={receipt.id}>
                <td><span className="sku-text">{receipt.receiptNumber}</span></td>
                <td className="product-name">{receipt.supplierName}</td>
                <td>{receipt.warehouseName}</td>
                <td><span className="type-badge receiving">{receipt.locationCode}</span></td>
                <td><strong>{receipt.lines.length}</strong> kalem<span className="cell-subtext">{totalQuantity} toplam adet</span></td>
                <td>{new Date(receipt.receivedAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><div className="row-actions"><button type="button" className="icon-button" title="Mal kabul detayını görüntüle" aria-label={`${receipt.receiptNumber} detayını görüntüle`} onClick={() => setSelectedReceipt(receipt)}><Eye size={17} /></button></div></td>
              </tr>
            })}</tbody>
          </table>
        </div>
        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Mal kabul kayıtları yükleniyor</span></div>}
        {!loading && visibleReceipts.length === 0 && <div className="table-state"><PackageCheck size={28} /><strong>Mal kabul kaydı bulunamadı</strong><span>Depoya ilk ürün girişini oluşturun.</span></div>}
      </div>

      {formOpen && <div className="dialog-backdrop" role="presentation">
        <div className="product-dialog order-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-dialog-title">
          <div className="dialog-header"><div><span className="dialog-kicker">Giriş operasyonu</span><h2 id="receipt-dialog-title">Yeni Mal Kabul</h2></div><button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button></div>
          <form onSubmit={handleSubmit}>
            <div className="dialog-body">
              {formError && <div className="alert alert-danger py-2">{formError}</div>}
              <div className="order-form-grid">
                <div><label className="form-label" htmlFor="receipt-supplier">Tedarikçi</label><input id="receipt-supplier" className="form-control" maxLength={150} required value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} /></div>
                <div><label className="form-label" htmlFor="receipt-warehouse">Depo</label><select id="receipt-warehouse" className="form-select" required value={form.warehouseId} onChange={(event) => void changeWarehouse(event.target.value)}><option value="">Depo seçin</option>{activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></div>
                <div><label className="form-label" htmlFor="receipt-location">Mal kabul lokasyonu</label><select id="receipt-location" className="form-select" required disabled={!form.warehouseId || locationsLoading} value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}><option value="">{locationsLoading ? 'Yükleniyor...' : 'Receiving lokasyonu seçin'}</option>{receivingLocations.map((location) => <option key={location.id} value={location.id}>{location.code}{location.name ? ` · ${location.name}` : ''}</option>)}</select></div>
              </div>
              <div className="order-lines-header"><strong>Kabul Edilen Ürünler</strong><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setForm({ ...form, lines: [...form.lines, { productId: '', quantity: 1 }] })}><Plus size={16} /> Satır Ekle</button></div>
              <div className="order-lines">{form.lines.map((line, index) => <div className="order-line" key={index}>
                <div><label className="form-label" htmlFor={`receipt-product-${index}`}>Ürün</label><select id={`receipt-product-${index}`} className="form-select" required value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}><option value="">Ürün seçin</option>{activeProducts.map((product) => <option key={product.id} value={product.id} disabled={form.lines.some((otherLine, otherIndex) => otherIndex !== index && otherLine.productId === String(product.id))}>{product.sku} · {product.name}</option>)}</select></div>
                <div><label className="form-label" htmlFor={`receipt-quantity-${index}`}>Miktar</label><input id={`receipt-quantity-${index}`} className="form-control" type="number" min={1} step={1} required value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></div>
                <button type="button" className="icon-button danger order-line-remove" title="Satırı kaldır" aria-label={`${index + 1}. satırı kaldır`} disabled={form.lines.length === 1} onClick={() => removeLine(index)}><Trash2 size={17} /></button>
              </div>)}</div>
            </div>
            <div className="dialog-footer"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button><button type="submit" className="btn btn-dark" disabled={saving}><ArrowDownToLine size={17} /> {saving ? 'Kaydediliyor...' : 'Mal Kabulü Tamamla'}</button></div>
          </form>
        </div>
      </div>}

      {selectedReceipt && <div className="dialog-backdrop" role="presentation">
        <div className="product-dialog receipt-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-detail-title">
          <div className="dialog-header"><div><span className="dialog-kicker">Mal kabul detayı</span><h2 id="receipt-detail-title">{selectedReceipt.receiptNumber}</h2></div><button type="button" className="icon-button" title="Detayı kapat" aria-label="Detayı kapat" onClick={() => setSelectedReceipt(null)}><X size={20} /></button></div>
          <div className="dialog-body">
            <dl className="receipt-summary"><div><dt>Tedarikçi</dt><dd>{selectedReceipt.supplierName}</dd></div><div><dt>Depo / Lokasyon</dt><dd>{selectedReceipt.warehouseName} · {selectedReceipt.locationCode}</dd></div></dl>
            <div className="receipt-detail-lines">{selectedReceipt.lines.map((line) => <div key={line.id}><span><strong>{line.productName}</strong><small>{line.productSku}</small></span><strong>{line.quantity} adet</strong></div>)}</div>
          </div>
          <div className="dialog-footer"><button type="button" className="btn btn-dark" onClick={() => setSelectedReceipt(null)}>Kapat</button></div>
        </div>
      </div>}
    </section>
  )
}

export default GoodsReceiptsPage
