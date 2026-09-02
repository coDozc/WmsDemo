import {
  Boxes,
  CircleAlert,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adjustStock, getInventory } from '../api/inventoryApi'
import { getLocations } from '../api/locationApi'
import { getProducts } from '../api/productApi'
import { getWarehouses } from '../api/warehouseApi'
import type { InventoryBalance } from '../types/inventory'
import type { Location } from '../types/location'
import type { Product } from '../types/product'
import type { Warehouse } from '../types/warehouse'

type StockFilter = 'all' | 'low' | 'normal'

type AdjustmentFormState = {
  productId: string
  warehouseId: string
  locationId: string
  quantityChange: string
  reason: string
}

const emptyForm: AdjustmentFormState = {
  productId: '',
  warehouseId: '',
  locationId: '',
  quantityChange: '',
  reason: '',
}

function InventoryPage() {
  const [balances, setBalances] = useState<InventoryBalance[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [formLocations, setFormLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<AdjustmentFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadBalances() {
    setLoading(true)
    setError(null)

    try {
      setBalances(await getInventory())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Stoklar alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        const [inventoryResult, productResult, warehouseResult] = await Promise.all([
          getInventory(),
          getProducts(),
          getWarehouses(),
        ])

        setBalances(inventoryResult)
        setProducts(productResult)
        setWarehouses(warehouseResult)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Stok verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  const visibleBalances = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return balances.filter((balance) => {
      const matchesSearch =
        !normalizedQuery ||
        balance.productName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        balance.productSku.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        balance.locationCode.toLocaleLowerCase('tr-TR').includes(normalizedQuery)

      const matchesWarehouse =
        warehouseFilter === 'all' ||
        balance.warehouseId === Number(warehouseFilter)

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && balance.isBelowMinimumStock) ||
        (stockFilter === 'normal' && !balance.isBelowMinimumStock)

      return matchesSearch && matchesWarehouse && matchesStock
    })
  }, [balances, query, warehouseFilter, stockFilter])

  async function loadFormLocations(warehouseId: number) {
    setLocationsLoading(true)

    try {
      const locations = await getLocations(warehouseId)
      setFormLocations(locations.filter((location) => location.isActive))
    } catch (requestError) {
      setFormLocations([])
      setFormError(requestError instanceof Error ? requestError.message : 'Lokasyonlar alınamadı.')
    } finally {
      setLocationsLoading(false)
    }
  }

  async function openAdjustmentForm() {
    const firstWarehouse = warehouses.find((warehouse) => warehouse.isActive)

    setForm({
      ...emptyForm,
      warehouseId: firstWarehouse ? String(firstWarehouse.id) : '',
    })
    setFormLocations([])
    setFormError(null)
    setFormOpen(true)

    if (firstWarehouse) await loadFormLocations(firstWarehouse.id)
  }

  async function changeFormWarehouse(value: string) {
    setForm({ ...form, warehouseId: value, locationId: '' })
    setFormError(null)
    setFormLocations([])

    if (value) await loadFormLocations(Number(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      const quantityChange = Number(form.quantityChange)

      if (quantityChange === 0) {
        throw new Error('Miktar değişimi sıfır olamaz.')
      }

      await adjustStock({
        productId: Number(form.productId),
        locationId: Number(form.locationId),
        quantityChange,
        reason: form.reason,
      })

      setFormOpen(false)
      await loadBalances()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Stok güncellenemedi.')
    } finally {
      setSaving(false)
    }
  }

  const activeProducts = products.filter((product) => product.isActive)
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive)
  const totalQuantity = visibleBalances.reduce((total, balance) => total + balance.quantity, 0)

  return (
    <section>
      <div className="page-toolbar inventory-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input type="search" className="form-control" placeholder="SKU, ürün veya lokasyon ara" aria-label="Stoklarda ara" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        <select className="form-select" aria-label="Depoya göre filtrele" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
          <option value="all">Tüm depolar</option>
          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
        </select>

        <select className="form-select" aria-label="Stok durumuna göre filtrele" value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
          <option value="all">Tüm stoklar</option>
          <option value="low">Kritik stok</option>
          <option value="normal">Normal stok</option>
        </select>

        <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadBalances()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>

        <button type="button" className="btn btn-dark add-button" onClick={() => void openAdjustmentForm()} disabled={activeProducts.length === 0 || activeWarehouses.length === 0}>
          <SlidersHorizontal size={18} />
          Stok Düzelt
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleBalances.length} bakiye</span>
        <span className="list-meta-separator" />
        <span>{totalQuantity} toplam miktar</span>
        <span className="list-meta-separator" />
        <span>{balances.filter((balance) => balance.isBelowMinimumStock).length} kritik</span>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table inventory-table mb-0 align-middle">
            <thead><tr><th>SKU</th><th>Ürün</th><th>Depo</th><th>Lokasyon</th><th className="text-end">Miktar</th><th className="text-end">Minimum</th><th>Durum</th><th>Güncelleme</th></tr></thead>
            <tbody>
              {!loading && visibleBalances.map((balance) => (
                <tr key={balance.id}>
                  <td><span className="sku-text">{balance.productSku}</span></td>
                  <td className="product-name">{balance.productName}</td>
                  <td>{balance.warehouseName}</td>
                  <td><span className="sku-text">{balance.locationCode}</span>{balance.locationName && <span className="cell-subtext">{balance.locationName}</span>}</td>
                  <td className="text-end"><strong className={balance.isBelowMinimumStock ? 'quantity-low' : ''}>{balance.quantity}</strong></td>
                  <td className="text-end">{balance.minimumStock}</td>
                  <td><span className={`status-badge ${balance.isBelowMinimumStock ? 'critical' : 'active'}`}>{balance.isBelowMinimumStock ? 'Kritik' : 'Normal'}</span></td>
                  <td>{new Date(balance.updatedAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Stoklar yükleniyor</span></div>}
        {!loading && visibleBalances.length === 0 && <div className="table-state"><Boxes size={28} /><strong>Stok bakiyesi bulunamadı</strong><span>İlk bakiyeyi oluşturmak için stok düzeltme işlemi yapın.</span></div>}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="adjustment-dialog-title">
            <div className="dialog-header">
              <div><span className="dialog-kicker">Manuel işlem</span><h2 id="adjustment-dialog-title">Stok Düzeltme</h2></div>
              <button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <div className="mb-3"><label className="form-label" htmlFor="adjustment-product">Ürün</label><select id="adjustment-product" className="form-select" required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}><option value="">Ürün seçin</option>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}</select></div>

                <div className="mb-3"><label className="form-label" htmlFor="adjustment-warehouse">Depo</label><select id="adjustment-warehouse" className="form-select" required value={form.warehouseId} onChange={(event) => void changeFormWarehouse(event.target.value)}><option value="">Depo seçin</option>{activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></div>

                <div className="mb-3"><label className="form-label" htmlFor="adjustment-location">Lokasyon</label><select id="adjustment-location" className="form-select" required disabled={!form.warehouseId || locationsLoading} value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}><option value="">{locationsLoading ? 'Yükleniyor...' : 'Lokasyon seçin'}</option>{formLocations.map((location) => <option key={location.id} value={location.id}>{location.code}{location.name ? ` · ${location.name}` : ''}</option>)}</select></div>

                <div className="mb-3"><label className="form-label" htmlFor="adjustment-quantity">Miktar değişimi</label><input id="adjustment-quantity" className="form-control" type="number" step={1} required placeholder="Örn. 10 veya -3" value={form.quantityChange} onChange={(event) => setForm({ ...form, quantityChange: event.target.value })} /></div>

                <div><label className="form-label" htmlFor="adjustment-reason">Gerekçe</label><textarea id="adjustment-reason" className="form-control" rows={3} maxLength={250} required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div>
              </div>

              <div className="dialog-footer"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button><button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Stoku Güncelle'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default InventoryPage
