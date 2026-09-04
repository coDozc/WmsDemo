import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  MapPin,
  RefreshCw,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getInventory } from '../api/inventoryApi'
import { getLocations } from '../api/locationApi'
import { getWarehouseById } from '../api/warehouseApi'
import type { InventoryBalance } from '../types/inventory'
import type { Location, LocationType } from '../types/location'
import type { Warehouse } from '../types/warehouse'

const locationTypeLabels: Record<LocationType, string> = {
  Receiving: 'Mal Kabul',
  Storage: 'Depolama',
  Shipping: 'Sevkiyat',
}

function WarehouseDetailPage() {
  const { warehouseId } = useParams()
  const id = Number(warehouseId)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [inventory, setInventory] = useState<InventoryBalance[]>([])
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadWarehouseDetail() {
    if (!Number.isInteger(id) || id < 1) {
      setError('Geçersiz depo numarası.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [warehouseResult, locationResult, inventoryResult] = await Promise.all([
        getWarehouseById(id),
        getLocations(id),
        getInventory({ warehouseId: id }),
      ])

      setWarehouse(warehouseResult)
      setLocations(locationResult)
      setInventory(inventoryResult)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Depo detayı alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWarehouseDetail()
  }, [warehouseId])

  const inventoryByLocation = useMemo(() => {
    const grouped = new Map<number, InventoryBalance[]>()

    for (const balance of inventory) {
      const balances = grouped.get(balance.locationId) ?? []
      balances.push(balance)
      grouped.set(balance.locationId, balances)
    }

    return grouped
  }, [inventory])

  const totalQuantity = inventory.reduce((total, balance) => total + balance.quantity, 0)
  const criticalProductCount = inventory.filter((balance) => balance.isBelowMinimumStock).length
  const activeLocationCount = locations.filter((location) => location.isActive).length

  if (!loading && !warehouse) {
    return <section>
      <Link className="detail-back-link" to="/warehouses"><ArrowLeft size={16} /> Depolara dön</Link>
      <div className="alert alert-danger d-flex align-items-center gap-2 mt-3" role="alert"><CircleAlert size={18} /><span>{error ?? 'Depo bulunamadı.'}</span></div>
    </section>
  }

  return <section className="warehouse-detail-page">
    <div className="detail-page-actions">
      <Link className="detail-back-link" to="/warehouses"><ArrowLeft size={16} /> Depolara dön</Link>
      <button type="button" className="icon-button toolbar-refresh" title="Depo detayını yenile" aria-label="Depo detayını yenile" onClick={() => void loadWarehouseDetail()} disabled={loading}><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>
    </div>

    {error && warehouse && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

    <div className="warehouse-detail-header">
      <div className="warehouse-detail-identity">
        <span className="warehouse-detail-icon"><WarehouseIcon size={22} /></span>
        <div><span className="sku-text">{warehouse?.code ?? '...'}</span><h2>{warehouse?.name ?? 'Depo yükleniyor'}</h2></div>
        {warehouse && <span className={`status-badge ${warehouse.isActive ? 'active' : 'inactive'}`}>{warehouse.isActive ? 'Aktif' : 'Pasif'}</span>}
      </div>
      <div className="warehouse-metrics" aria-label="Depo özeti">
        <div><span>Lokasyon</span><strong>{locations.length}</strong><small>{activeLocationCount} aktif</small></div>
        <div><span>Ürün bakiyesi</span><strong>{inventory.length}</strong><small>{criticalProductCount} kritik</small></div>
        <div><span>Toplam stok</span><strong>{totalQuantity}</strong><small>adet</small></div>
      </div>
    </div>

    <div className="detail-section-heading">
      <div><span className="detail-section-icon"><MapPin size={18} /></span><div><h3>Lokasyonlar</h3><p>Bir lokasyonu açarak mevcut stoklarını görüntüleyin.</p></div></div>
      <span>{locations.length} lokasyon</span>
    </div>

    <div className="table-shell warehouse-locations-shell">
      <div className="table-responsive">
        <table className="table products-table warehouse-locations-table mb-0 align-middle">
          <thead><tr>
                    <th>Lokasyon</th>
                    <th>Ad</th>
                    <th>Tip</th>
                    <th>Durum</th>
                    <th className="text-end">Ürün Çeşidi</th>
                    <th className="text-end">Toplam Stok</th>
                    <th className="text-end">Kritik</th>
                    <th aria-label="Detay" />
                  </tr>
          </thead>
          <tbody>
            {!loading && locations.map((location) => {
              const stocks = inventoryByLocation.get(location.id) ?? []
              const locationQuantity = stocks.reduce((total, stock) => total + stock.quantity, 0)
              const criticalCount = stocks.filter((stock) => stock.isBelowMinimumStock).length
              const expanded = expandedLocationId === location.id

              return <LocationRows
                key={location.id}
                location={location}
                stocks={stocks}
                totalQuantity={locationQuantity}
                criticalCount={criticalCount}
                expanded={expanded}
                onToggle={() => setExpandedLocationId(expanded ? null : location.id)}
              />
            })}
          </tbody>
        </table>
      </div>
      {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Depo bilgileri yükleniyor</span></div>}
      {!loading && locations.length === 0 && <div className="table-state"><MapPin size={28} /><strong>Lokasyon bulunamadı</strong><span>Bu depoya henüz lokasyon eklenmemiş.</span></div>}
    </div>
  </section>
}

type LocationRowsProps = {
  location: Location
  stocks: InventoryBalance[]
  totalQuantity: number
  criticalCount: number
  expanded: boolean
  onToggle: () => void
}

function LocationRows({ location, stocks, totalQuantity, criticalCount, expanded, onToggle }: LocationRowsProps) {
  return <>
    <tr className={expanded ? 'location-row is-expanded' : 'location-row'}>
      <td><button type="button" className="location-code-button" onClick={onToggle} aria-expanded={expanded}><span className="sku-text">{location.code}</span></button></td>
      <td>{location.name || <span className="muted-value">Tanımsız</span>}</td>
      <td><span className={`type-badge ${location.type.toLowerCase()}`}>{locationTypeLabels[location.type]}</span></td>
      <td><span className={`status-badge ${location.isActive ? 'active' : 'inactive'}`}>{location.isActive ? 'Aktif' : 'Pasif'}</span></td>
      <td className="text-end">{stocks.length}</td>
      <td className="text-end"><strong>{totalQuantity}</strong></td>
      <td className="text-end"><span className={criticalCount > 0 ? 'quantity-low' : ''}>{criticalCount}</span></td>
      <td className="text-end"><button type="button" className="icon-button" title={expanded ? 'Stokları gizle' : 'Stokları göster'} aria-label={`${location.code} stoklarını ${expanded ? 'gizle' : 'göster'}`} aria-expanded={expanded} onClick={onToggle}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button></td>
    </tr>
    {expanded && <tr className="location-stock-row"><td colSpan={8}>
      {stocks.length === 0
        ? <div className="location-empty-stock"><Boxes size={20} /><span>Bu lokasyonda stok bulunmuyor.</span></div>
        : <div className="location-stock-table-wrap"><table className="table location-stock-table mb-0 align-middle"><thead><tr><th>SKU</th><th>Ürün</th><th className="text-end">Miktar</th><th className="text-end">Minimum</th><th>Durum</th><th>Güncelleme</th></tr></thead><tbody>{stocks.map((stock) => <tr key={stock.id}><td><span className="sku-text">{stock.productSku}</span></td><td className="product-name">{stock.productName}</td><td className="text-end"><strong className={stock.isBelowMinimumStock ? 'quantity-low' : ''}>{stock.quantity}</strong></td><td className="text-end">{stock.minimumStock}</td><td><span className={`status-badge ${stock.isBelowMinimumStock ? 'critical' : 'active'}`}>{stock.isBelowMinimumStock ? 'Kritik' : 'Normal'}</span></td><td>{new Date(stock.updatedAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>)}</tbody></table></div>}
    </td></tr>}
  </>
}

export default WarehouseDetailPage
