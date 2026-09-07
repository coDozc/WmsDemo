import {
  Ban,
  CircleAlert,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { cancelOrder, createOrder, getOrders, updateOrder } from '../api/orderApi'
import { getProducts } from '../api/productApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Order, OrderLineRequest, OrderStatus } from '../types/order'
import type { Product } from '../types/product'
import type { Warehouse } from '../types/warehouse'

type StatusFilter = 'all' | OrderStatus

type OrderFormState = {
  warehouseId: string
  customerName: string
  lines: Array<{ productId: string; quantity: number }>
}

const statusLabels: Record<OrderStatus, string> = {
  Draft: 'Taslak',
  ReadyToPick: 'Toplamaya Hazır',
  Picking: 'Toplanıyor',
  Shipping: 'Sevkiyatta',
  Completed: 'Tamamlandı',
  Cancelled: 'İptal',
}

const emptyForm: OrderFormState = {
  warehouseId: '',
  customerName: '',
  lines: [{ productId: '', quantity: 1 }],
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [form, setForm] = useState<OrderFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadOrders() {
    setLoading(true)
    setError(null)

    try {
      setOrders(await getOrders())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Siparişler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        const [orderResult, productResult, warehouseResult] = await Promise.all([
          getOrders(),
          getProducts(),
          getWarehouses(),
        ])
        setOrders(orderResult)
        setProducts(productResult)
        setWarehouses(warehouseResult)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Sipariş verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedQuery ||
        order.orderNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        order.customerName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        order.warehouseName.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, query, statusFilter])

  const activeProducts = products.filter((product) => product.isActive)
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive)

  function openCreateForm() {
    setEditingOrder(null)
    setForm({
      ...emptyForm,
      warehouseId: activeWarehouses[0] ? String(activeWarehouses[0].id) : '',
      lines: [{ productId: '', quantity: 1 }],
    })
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(order: Order) {
    setEditingOrder(order)
    setForm({
      warehouseId: String(order.warehouseId),
      customerName: order.customerName,
      lines: order.lines.map((line) => ({
        productId: String(line.productId),
        quantity: line.quantity,
      })),
    })
    setFormError(null)
    setFormOpen(true)
  }

  function updateLine(index: number, change: Partial<OrderFormState['lines'][number]>) {
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
      const lines: OrderLineRequest[] = form.lines.map((line) => ({
        productId: Number(line.productId),
        quantity: line.quantity,
      }))
      const productIds = lines.map((line) => line.productId)

      if (productIds.some((id) => id === 0)) throw new Error('Her satır için ürün seçmelisiniz.')
      if (new Set(productIds).size !== productIds.length) {
        throw new Error('Aynı ürün siparişte birden fazla satırda bulunamaz.')
      }

      const request = {
        warehouseId: Number(form.warehouseId),
        customerName: form.customerName,
        lines,
      }

      if (editingOrder) await updateOrder(editingOrder.id, request)
      else await createOrder(request)

      setFormOpen(false)
      await loadOrders()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(order: Order) {
    if (!window.confirm(`${order.orderNumber} numaralı sipariş iptal edilsin mi?`)) return

    try {
      await cancelOrder(order.id)
      await loadOrders()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sipariş iptal edilemedi.')
    }
  }

  return (
    <section>
      <div className="page-toolbar orders-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input className="form-control" type="search" placeholder="Sipariş no, müşteri veya depo ara" aria-label="Siparişlerde ara" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="form-select status-filter" aria-label="Duruma göre filtrele" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          <option value="all">Tüm durumlar</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadOrders()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
        <button type="button" className="btn btn-dark add-button" onClick={openCreateForm} disabled={activeProducts.length === 0 || activeWarehouses.length === 0}>
          <Plus size={18} /> Yeni Sipariş
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleOrders.length} sipariş</span><span className="list-meta-separator" />
        <span>{orders.filter((order) => order.status === 'Draft').length} taslak</span><span className="list-meta-separator" />
        <span>{orders.filter((order) => order.status === 'Completed').length} tamamlandı</span>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table orders-table mb-0 align-middle">
            <thead><tr><th>Sipariş No</th><th>Müşteri</th><th>Depo</th><th>Ürün / Miktar</th><th>Durum</th><th>Oluşturma</th><th className="text-end">İşlemler</th></tr></thead>
            <tbody>
              {!loading && visibleOrders.map((order) => {
                const totalQuantity = order.lines.reduce((sum, line) => sum + line.quantity, 0)
                const canEdit = order.status === 'Draft'
                const canCancel = !['Cancelled', 'Shipping', 'Completed'].includes(order.status)

                return (
                  <tr key={order.id}>
                    <td><span className="sku-text">{order.orderNumber}</span></td>
                    <td className="product-name">{order.customerName}</td>
                    <td>{order.warehouseName}</td>
                    <td><strong>{order.lines.length}</strong> kalem<span className="cell-subtext">{totalQuantity} toplam adet</span></td>
                    <td><span className={`order-status ${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span></td>
                    <td>{new Date(order.createdAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><div className="row-actions">
                      <button type="button" className="icon-button" title="Siparişi düzenle" aria-label={`${order.orderNumber} siparişini düzenle`} disabled={!canEdit} onClick={() => openEditForm(order)}><Pencil size={17} /></button>
                      <button type="button" className="icon-button danger" title="Siparişi iptal et" aria-label={`${order.orderNumber} siparişini iptal et`} disabled={!canCancel} onClick={() => void handleCancel(order)}><Ban size={17} /></button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Siparişler yükleniyor</span></div>}
        {!loading && visibleOrders.length === 0 && <div className="table-state"><ClipboardList size={28} /><strong>Sipariş bulunamadı</strong><span>Filtreleri değiştirin veya yeni sipariş oluşturun.</span></div>}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title">
            <div className="dialog-header">
              <div><span className="dialog-kicker">Çıkış operasyonu</span><h2 id="order-dialog-title">{editingOrder ? `Siparişi Düzenle · ${editingOrder.orderNumber}` : 'Yeni Sipariş'}</h2></div>
              <button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="order-form-grid">
                  <div><label className="form-label" htmlFor="order-warehouse">Depo</label><select id="order-warehouse" className="form-select" required value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}><option value="">Depo seçin</option>{activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></div>
                  <div><label className="form-label" htmlFor="order-customer">Müşteri</label><input id="order-customer" className="form-control" maxLength={200} required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></div>
                </div>

                <div className="order-lines-header"><strong>Sipariş Kalemleri</strong><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setForm({ ...form, lines: [...form.lines, { productId: '', quantity: 1 }] })}><Plus size={16} /> Satır Ekle</button></div>
                <div className="order-lines">
                  {form.lines.map((line, index) => (
                    <div className="order-line" key={index}>
                      <div><label className="form-label" htmlFor={`order-product-${index}`}>Ürün</label><select id={`order-product-${index}`} className="form-select" required value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}><option value="">Ürün seçin</option>{activeProducts.map((product) => <option key={product.id} value={product.id} disabled={form.lines.some((otherLine, otherIndex) => otherIndex !== index && otherLine.productId === String(product.id))}>{product.sku} · {product.name}</option>)}</select></div>
                      <div><label className="form-label" htmlFor={`order-quantity-${index}`}>Miktar</label><input id={`order-quantity-${index}`} className="form-control" type="number" min={1} step={1} required value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /></div>
                      <button type="button" className="icon-button danger order-line-remove" title="Satırı kaldır" aria-label={`${index + 1}. satırı kaldır`} disabled={form.lines.length === 1} onClick={() => removeLine(index)}><Trash2 size={17} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dialog-footer"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button><button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default OrdersPage
