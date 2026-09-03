import {
  CircleAlert,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Send,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getLocations } from '../api/locationApi'
import { getOrders } from '../api/orderApi'
import { createShipment, getShipments } from '../api/shipmentApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Location } from '../types/location'
import type { Order } from '../types/order'
import type { Shipment } from '../types/shipment'

type ShipmentFormState = {
  shipmentNumber: string
  carrierName: string
  orderId: string
  locationId: string
}

const emptyForm: ShipmentFormState = {
  shipmentNumber: '',
  carrierName: '',
  orderId: '',
  locationId: '',
}

function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ShipmentFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadShipmentsAndOrders() {
    setLoading(true)
    setError(null)
    try {
      const [shipmentResult, orderResult] = await Promise.all([getShipments(), getOrders()])
      setShipments(shipmentResult)
      setOrders(orderResult)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sevkiyatlar alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)
      try {
        const [shipmentResult, orderResult, warehouseResult] = await Promise.all([
          getShipments(),
          getOrders(),
          getWarehouses(),
        ])
        const locationGroups = await Promise.all(
          warehouseResult.filter((warehouse) => warehouse.isActive).map((warehouse) => getLocations(warehouse.id)),
        )
        setShipments(shipmentResult)
        setOrders(orderResult)
        setLocations(locationGroups.flat().filter((location) => location.isActive && location.type === 'Shipping'))
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Sevkiyat verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }
    void loadInitialData()
  }, [])

  const visibleShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
    if (!normalizedQuery) return shipments
    return shipments.filter((shipment) =>
      shipment.shipmentNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      shipment.orderNumber.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      shipment.customerName.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      shipment.carrierName.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
    )
  }, [shipments, query])

  const eligibleOrders = orders.filter((order) =>
    order.isActive && !['Cancelled', 'Completed', 'Shipping'].includes(order.status),
  )
  const selectedOrder = eligibleOrders.find((order) => String(order.id) === form.orderId)
  const shippingLocations = locations.filter((location) =>
    location.warehouseId === selectedOrder?.warehouseId,
  )

  function openCreateForm() {
    const order = eligibleOrders[0]
    const location = locations.find((item) => item.warehouseId === order?.warehouseId)
    setForm({
      ...emptyForm,
      orderId: order ? String(order.id) : '',
      locationId: location ? String(location.id) : '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function changeOrder(value: string) {
    const order = eligibleOrders.find((item) => String(item.id) === value)
    const location = locations.find((item) => item.warehouseId === order?.warehouseId)
    setForm({ ...form, orderId: value, locationId: location ? String(location.id) : '' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (!form.locationId) throw new Error('Sipariş deposunda aktif Shipping lokasyonu bulunamadı.')
      await createShipment({
        shipmentNumber: form.shipmentNumber,
        carrierName: form.carrierName,
        orderId: Number(form.orderId),
        locationId: Number(form.locationId),
      })
      setFormOpen(false)
      await loadShipmentsAndOrders()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Sevkiyat tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  return <section>
    <div className="page-toolbar receipts-toolbar">
      <div className="search-control"><Search size={18} aria-hidden="true" /><input className="form-control" type="search" placeholder="Sevkiyat, sipariş, müşteri veya taşıyıcı ara" aria-label="Sevkiyatlarda ara" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadShipmentsAndOrders()} disabled={loading}><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>
      <button type="button" className="btn btn-dark add-button" onClick={openCreateForm} disabled={eligibleOrders.length === 0 || locations.length === 0}><Plus size={18} /> Yeni Sevkiyat</button>
    </div>
    <div className="list-meta"><span>{visibleShipments.length} sevkiyat</span><span className="list-meta-separator" /><span>{visibleShipments.reduce((total, shipment) => total + shipment.lines.reduce((sum, line) => sum + line.quantity, 0), 0)} toplam adet</span></div>
    {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}
    <div className="table-shell">
      <div className="table-responsive"><table className="table products-table operation-table mb-0 align-middle"><thead><tr><th>Sevkiyat No</th><th>Sipariş</th><th>Müşteri</th><th>Depo / Lokasyon</th><th>Taşıyıcı</th><th>Ürün / Miktar</th><th>Sevk Zamanı</th><th className="text-end">Detay</th></tr></thead><tbody>
        {!loading && visibleShipments.map((shipment) => <tr key={shipment.id}><td><span className="sku-text">{shipment.shipmentNumber}</span></td><td><span className="sku-text">{shipment.orderNumber}</span></td><td className="product-name">{shipment.customerName}</td><td>{shipment.warehouseName}<span className="cell-subtext">{shipment.locationCode}</span></td><td>{shipment.carrierName}</td><td><strong>{shipment.lines.length}</strong> kalem<span className="cell-subtext">{shipment.lines.reduce((sum, line) => sum + line.quantity, 0)} toplam adet</span></td><td>{new Date(shipment.shippedAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><div className="row-actions"><button type="button" className="icon-button" title="Sevkiyat detayını görüntüle" aria-label={`${shipment.shipmentNumber} detayını görüntüle`} onClick={() => setSelectedShipment(shipment)}><Eye size={17} /></button></div></td></tr>)}
      </tbody></table></div>
      {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Sevkiyatlar yükleniyor</span></div>}
      {!loading && visibleShipments.length === 0 && <div className="table-state"><Send size={28} /><strong>Sevkiyat bulunamadı</strong><span>Sipariş için ilk çıkış belgesini oluşturun.</span></div>}
    </div>

    {formOpen && <div className="dialog-backdrop" role="presentation"><div className="product-dialog order-dialog" role="dialog" aria-modal="true" aria-labelledby="shipment-dialog-title">
      <div className="dialog-header"><div><span className="dialog-kicker">Çıkış operasyonu</span><h2 id="shipment-dialog-title">Yeni Sevkiyat</h2></div><button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button></div>
      <form onSubmit={handleSubmit}><div className="dialog-body">{formError && <div className="alert alert-danger py-2">{formError}</div>}
        <div className="order-form-grid">
          <div><label className="form-label" htmlFor="shipment-number">Sevkiyat numarası</label><input id="shipment-number" className="form-control" maxLength={50} required autoFocus value={form.shipmentNumber} onChange={(event) => setForm({ ...form, shipmentNumber: event.target.value })} /></div>
          <div><label className="form-label" htmlFor="shipment-carrier">Taşıyıcı</label><input id="shipment-carrier" className="form-control" maxLength={100} required placeholder="Örn. Demo Lojistik" value={form.carrierName} onChange={(event) => setForm({ ...form, carrierName: event.target.value })} /></div>
          <div><label className="form-label" htmlFor="shipment-order">Sipariş</label><select id="shipment-order" className="form-select" required value={form.orderId} onChange={(event) => changeOrder(event.target.value)}><option value="">Sipariş seçin</option>{eligibleOrders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.customerName}</option>)}</select></div>
          <div><label className="form-label" htmlFor="shipment-location">Shipping lokasyonu</label><select id="shipment-location" className="form-select" required disabled={!form.orderId} value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}><option value="">Shipping lokasyonu seçin</option>{shippingLocations.map((location) => <option key={location.id} value={location.id}>{location.code}{location.name ? ` · ${location.name}` : ''}</option>)}</select></div>
        </div>
        {selectedOrder && <div className="shipment-order-preview"><div><span>Sipariş deposu</span><strong>{selectedOrder.warehouseName}</strong></div><div><span>Toplam miktar</span><strong>{selectedOrder.lines.reduce((sum, line) => sum + line.quantity, 0)} adet</strong></div><div className="shipment-preview-lines">{selectedOrder.lines.map((line) => <span key={line.id}>{line.productSku} · {line.productName}<strong>{line.quantity}</strong></span>)}</div></div>}
      </div><div className="dialog-footer"><button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button><button type="submit" className="btn btn-dark" disabled={saving}><Truck size={17} /> {saving ? 'Sevk ediliyor...' : 'Sevkiyatı Tamamla'}</button></div></form>
    </div></div>}

    {selectedShipment && <div className="dialog-backdrop" role="presentation"><div className="product-dialog receipt-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="shipment-detail-title"><div className="dialog-header"><div><span className="dialog-kicker">Sevkiyat detayı</span><h2 id="shipment-detail-title">{selectedShipment.shipmentNumber}</h2></div><button type="button" className="icon-button" title="Detayı kapat" aria-label="Detayı kapat" onClick={() => setSelectedShipment(null)}><X size={20} /></button></div><div className="dialog-body"><dl className="receipt-summary"><div><dt>Sipariş / Müşteri</dt><dd>{selectedShipment.orderNumber} · {selectedShipment.customerName}</dd></div><div><dt>Çıkış / Taşıyıcı</dt><dd>{selectedShipment.locationCode} · {selectedShipment.carrierName}</dd></div></dl><div className="receipt-detail-lines">{selectedShipment.lines.map((line) => <div key={line.id}><span><strong>{line.productName}</strong><small>{line.productSku}</small></span><strong>{line.quantity} adet</strong></div>)}</div></div><div className="dialog-footer"><button type="button" className="btn btn-dark" onClick={() => setSelectedShipment(null)}>Kapat</button></div></div></div>}
  </section>
}

export default ShipmentsPage
