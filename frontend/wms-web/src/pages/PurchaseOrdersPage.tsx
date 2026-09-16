import {
  Ban,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getProducts } from '../api/productApi'
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrder,
} from '../api/purchaseOrderApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Product } from '../types/product'
import type {
  PurchaseOrder,
  PurchaseOrderLineRequest,
  PurchaseOrderStatus,
} from '../types/purchaseOrder'
import type { Warehouse } from '../types/warehouse'

type StatusFilter = 'all' | PurchaseOrderStatus

type PurchaseOrderFormState = {
  warehouseId: string
  supplierName: string
  lines: Array<{ productId: string; quantity: number }>
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  Draft: 'Taslak',
  Approved: 'Onaylandı',
  PartiallyReceived: 'Kısmi Kabul',
  Completed: 'Tamamlandı',
  Cancelled: 'İptal',
}

const emptyForm: PurchaseOrderFormState = {
  warehouseId: '',
  supplierName: '',
  lines: [{ productId: '', quantity: 1 }],
}

function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPurchaseOrder, setEditingPurchaseOrder] =
    useState<PurchaseOrder | null>(null)
  const [form, setForm] = useState<PurchaseOrderFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  async function loadPurchaseOrders() {
    setLoading(true)
    setError(null)

    try {
      setPurchaseOrders(await getPurchaseOrders())
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Satın alma siparişleri alınamadı.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        const [purchaseOrderResult, productResult, warehouseResult] = await Promise.all([
          getPurchaseOrders(),
          getProducts(),
          getWarehouses(),
        ])
        setPurchaseOrders(purchaseOrderResult)
        setProducts(productResult)
        setWarehouses(warehouseResult)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Satın alma siparişi verileri alınamadı.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadInitialData()
  }, [])

  const visiblePurchaseOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return purchaseOrders.filter((purchaseOrder) => {
      const matchesSearch =
        !normalizedQuery ||
        purchaseOrder.orderNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        purchaseOrder.supplierName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        purchaseOrder.warehouseName.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
      const matchesStatus =
        statusFilter === 'all' || purchaseOrder.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, query, statusFilter])

  const activeProducts = products.filter((product) => product.isActive)
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive)

  function openCreateForm() {
    setEditingPurchaseOrder(null)
    setForm({
      ...emptyForm,
      warehouseId: activeWarehouses[0] ? String(activeWarehouses[0].id) : '',
      lines: [{ productId: '', quantity: 1 }],
    })
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(purchaseOrder: PurchaseOrder) {
    setEditingPurchaseOrder(purchaseOrder)
    setForm({
      warehouseId: String(purchaseOrder.warehouseId),
      supplierName: purchaseOrder.supplierName,
      lines: purchaseOrder.lines.map((line) => ({
        productId: String(line.productId),
        quantity: line.orderedQuantity,
      })),
    })
    setFormError(null)
    setFormOpen(true)
  }

  function updateLine(
    index: number,
    change: Partial<PurchaseOrderFormState['lines'][number]>,
  ) {
    setForm({
      ...form,
      lines: form.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...change } : line,
      ),
    })
  }

  function removeLine(index: number) {
    if (form.lines.length === 1) return
    setForm({
      ...form,
      lines: form.lines.filter((_, lineIndex) => lineIndex !== index),
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      const lines: PurchaseOrderLineRequest[] = form.lines.map((line) => ({
        productId: Number(line.productId),
        quantity: line.quantity,
      }))
      const productIds = lines.map((line) => line.productId)

      if (productIds.some((id) => id === 0)) {
        throw new Error('Her satır için ürün seçmelisiniz.')
      }
      if (new Set(productIds).size !== productIds.length) {
        throw new Error('Aynı ürün siparişte birden fazla satırda bulunamaz.')
      }

      const request = {
        warehouseId: Number(form.warehouseId),
        supplierName: form.supplierName,
        lines,
      }

      if (editingPurchaseOrder) {
        await updatePurchaseOrder(editingPurchaseOrder.id, request)
      } else {
        await createPurchaseOrder(request)
      }

      setFormOpen(false)
      await loadPurchaseOrders()
    } catch (requestError) {
      setFormError(
        requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove(purchaseOrder: PurchaseOrder) {
    if (!window.confirm(`${purchaseOrder.orderNumber} numaralı sipariş onaylansın mı?`)) {
      return
    }

    setProcessingId(purchaseOrder.id)
    setError(null)
    try {
      await approvePurchaseOrder(purchaseOrder.id)
      await loadPurchaseOrders()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Satın alma siparişi onaylanamadı.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCancel(purchaseOrder: PurchaseOrder) {
    if (!window.confirm(`${purchaseOrder.orderNumber} numaralı sipariş iptal edilsin mi?`)) {
      return
    }

    setProcessingId(purchaseOrder.id)
    setError(null)
    try {
      await cancelPurchaseOrder(purchaseOrder.id)
      await loadPurchaseOrders()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Satın alma siparişi iptal edilemedi.',
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section>
      <div className="page-toolbar orders-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Sipariş no, tedarikçi veya depo ara"
            aria-label="Satın alma siparişlerinde ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="form-select status-filter"
          aria-label="Duruma göre filtrele"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
        >
          <option value="all">Tüm durumlar</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="button"
          className="icon-button toolbar-refresh"
          title="Listeyi yenile"
          aria-label="Listeyi yenile"
          onClick={() => void loadPurchaseOrders()}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
        <button
          type="button"
          className="btn btn-dark add-button"
          onClick={openCreateForm}
          disabled={activeProducts.length === 0 || activeWarehouses.length === 0}
        >
          <Plus size={18} /> Yeni Satın Alma
        </button>
      </div>

      <div className="list-meta">
        <span>{visiblePurchaseOrders.length} sipariş</span>
        <span className="list-meta-separator" />
        <span>{purchaseOrders.filter((item) => item.status === 'Draft').length} taslak</span>
        <span className="list-meta-separator" />
        <span>{purchaseOrders.filter((item) => item.status === 'Approved').length} onaylı</span>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table purchase-orders-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Tedarikçi</th>
                <th>Depo</th>
                <th>Ürün / Miktar</th>
                <th>Kabul</th>
                <th>Durum</th>
                <th>Oluşturma</th>
                <th className="text-end">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visiblePurchaseOrders.map((purchaseOrder) => {
                const totalOrdered = purchaseOrder.lines.reduce(
                  (sum, line) => sum + line.orderedQuantity,
                  0,
                )
                const totalReceived = purchaseOrder.lines.reduce(
                  (sum, line) => sum + line.receivedQuantity,
                  0,
                )
                const canEdit = purchaseOrder.status === 'Draft'
                const canApprove = purchaseOrder.status === 'Draft'
                const canCancel = !['Completed', 'Cancelled'].includes(purchaseOrder.status)
                const processing = processingId === purchaseOrder.id

                return (
                  <tr key={purchaseOrder.id}>
                    <td><span className="sku-text">{purchaseOrder.orderNumber}</span></td>
                    <td className="product-name">{purchaseOrder.supplierName}</td>
                    <td>{purchaseOrder.warehouseName}</td>
                    <td>
                      <strong>{purchaseOrder.lines.length}</strong> kalem
                      <span className="cell-subtext">{totalOrdered} toplam adet</span>
                    </td>
                    <td>
                      <strong>{totalReceived}</strong> / {totalOrdered}
                      <span className="cell-subtext">teslim alınan</span>
                    </td>
                    <td>
                      <span className={`order-status ${purchaseOrder.status.toLowerCase()}`}>
                        {statusLabels[purchaseOrder.status]}
                      </span>
                    </td>
                    <td>
                      {new Date(purchaseOrder.createdAtUtc).toLocaleString('tr-TR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Siparişi düzenle"
                          aria-label={`${purchaseOrder.orderNumber} siparişini düzenle`}
                          disabled={!canEdit || processing}
                          onClick={() => openEditForm(purchaseOrder)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button success"
                          title="Siparişi onayla"
                          aria-label={`${purchaseOrder.orderNumber} siparişini onayla`}
                          disabled={!canApprove || processing}
                          onClick={() => void handleApprove(purchaseOrder)}
                        >
                          <CheckCircle2 size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          title="Siparişi iptal et"
                          aria-label={`${purchaseOrder.orderNumber} siparişini iptal et`}
                          disabled={!canCancel || processing}
                          onClick={() => void handleCancel(purchaseOrder)}
                        >
                          <Ban size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="table-state">
            <RefreshCw className="spin" size={22} />
            <span>Satın alma siparişleri yükleniyor</span>
          </div>
        )}
        {!loading && visiblePurchaseOrders.length === 0 && (
          <div className="table-state">
            <ClipboardCheck size={28} />
            <strong>Satın alma siparişi bulunamadı</strong>
            <span>Filtreleri değiştirin veya yeni sipariş oluşturun.</span>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="product-dialog order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-order-dialog-title"
          >
            <div className="dialog-header">
              <div>
                <span className="dialog-kicker">Giriş planlama</span>
                <h2 id="purchase-order-dialog-title">
                  {editingPurchaseOrder
                    ? `Siparişi Düzenle · ${editingPurchaseOrder.orderNumber}`
                    : 'Yeni Satın Alma Siparişi'}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                title="Formu kapat"
                aria-label="Formu kapat"
                onClick={() => setFormOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <div className="order-form-grid">
                  <div>
                    <label className="form-label" htmlFor="purchase-order-warehouse">Depo</label>
                    <select
                      id="purchase-order-warehouse"
                      className="form-select"
                      required
                      value={form.warehouseId}
                      onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}
                    >
                      <option value="">Depo seçin</option>
                      {activeWarehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.code} · {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="purchase-order-supplier">Tedarikçi</label>
                    <input
                      id="purchase-order-supplier"
                      className="form-control"
                      maxLength={150}
                      required
                      value={form.supplierName}
                      onChange={(event) => setForm({ ...form, supplierName: event.target.value })}
                    />
                  </div>
                </div>

                <div className="order-lines-header">
                  <strong>Sipariş Kalemleri</strong>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setForm({
                      ...form,
                      lines: [...form.lines, { productId: '', quantity: 1 }],
                    })}
                  >
                    <Plus size={16} /> Satır Ekle
                  </button>
                </div>

                <div className="order-lines">
                  {form.lines.map((line, index) => (
                    <div className="order-line" key={index}>
                      <div>
                        <label className="form-label" htmlFor={`purchase-order-product-${index}`}>
                          Ürün
                        </label>
                        <select
                          id={`purchase-order-product-${index}`}
                          className="form-select"
                          required
                          value={line.productId}
                          onChange={(event) => updateLine(index, { productId: event.target.value })}
                        >
                          <option value="">Ürün seçin</option>
                          {activeProducts.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                              disabled={form.lines.some(
                                (otherLine, otherIndex) =>
                                  otherIndex !== index &&
                                  otherLine.productId === String(product.id),
                              )}
                            >
                              {product.sku} · {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" htmlFor={`purchase-order-quantity-${index}`}>
                          Miktar
                        </label>
                        <input
                          id={`purchase-order-quantity-${index}`}
                          className="form-control"
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={line.quantity}
                          onChange={(event) => updateLine(index, {
                            quantity: Number(event.target.value),
                          })}
                        />
                      </div>
                      <button
                        type="button"
                        className="icon-button danger order-line-remove"
                        title="Satırı kaldır"
                        aria-label={`${index + 1}. satırı kaldır`}
                        disabled={form.lines.length === 1}
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dialog-footer">
                <button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-dark" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default PurchaseOrdersPage
