import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Boxes,
  Building2,
  CircleAlert,
  ClipboardList,
  MapPin,
  PackageCheck,
  RefreshCw,
  Warehouse,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/dashboardApi'
import type { Dashboard, DashboardMovement } from '../types/dashboard'
import type { StockMovementType } from '../types/stockMovement'

const movementLabels: Record<StockMovementType, string> = {
  Adjustment: 'Düzeltme',
  Receipt: 'Mal kabul',
  Transfer: 'Transfer',
  Shipment: 'Sevkiyat',
}

const numberFormatter = new Intl.NumberFormat('tr-TR')

function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard() {
    setLoading(true)
    setError(null)

    try {
      setDashboard(await getDashboard())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Dashboard bilgileri alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialDashboard() {
      await Promise.resolve()

      try {
        setDashboard(await getDashboard())
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Dashboard bilgileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialDashboard()
  }, [])

  if (loading && !dashboard) {
    return <div className="dashboard-loading"><RefreshCw className="spin" size={24} /><span>Dashboard yükleniyor</span></div>
  }

  if (!dashboard) {
    return <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error ?? 'Dashboard bilgileri alınamadı.'}</span></div>
  }

  const maxWarehouseStock = Math.max(
    ...dashboard.warehouseStocks.map((warehouse) => warehouse.totalQuantity),
    1,
  )

  return (
    <section className="dashboard-page">
      <div className="dashboard-toolbar">
        <span>Son güncelleme: {new Date(dashboard.updatedAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        <button type="button" className="icon-button toolbar-refresh" title="Dashboard'u yenile" aria-label="Dashboard'u yenile" onClick={() => void loadDashboard()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="dashboard-kpis">
        <Link className="dashboard-kpi" to="/inventory">
          <span className="dashboard-kpi-icon stock"><Boxes size={20} /></span>
          <div><span>Toplam stok</span><strong>{numberFormatter.format(dashboard.totalStockQuantity)}</strong><small>tüm lokasyonlar</small></div>
        </Link>
        <Link className="dashboard-kpi" to="/products">
          <span className="dashboard-kpi-icon products"><PackageCheck size={20} /></span>
          <div><span>Aktif ürün</span><strong>{numberFormatter.format(dashboard.activeProductCount)}</strong><small>ürün kartı</small></div>
        </Link>
        <Link className={`dashboard-kpi ${dashboard.criticalStockCount > 0 ? 'has-warning' : ''}`} to="/inventory">
          <span className="dashboard-kpi-icon critical"><AlertTriangle size={20} /></span>
          <div><span>Kritik stok</span><strong>{numberFormatter.format(dashboard.criticalStockCount)}</strong><small>ürün / depo</small></div>
        </Link>
        <Link className="dashboard-kpi" to="/orders">
          <span className="dashboard-kpi-icon orders"><ClipboardList size={20} /></span>
          <div><span>Açık sipariş</span><strong>{numberFormatter.format(dashboard.openOrderCount)}</strong><small>tamamlanmamış</small></div>
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel warehouse-stock-panel">
          <div className="dashboard-panel-header">
            <div><span className="dashboard-section-icon"><Warehouse size={18} /></span><div><h2>Depo Stok Dağılımı</h2><p>Aktif depolardaki mevcut miktarlar</p></div></div>
            <Link to="/inventory">Stoklara git <ArrowRight size={15} /></Link>
          </div>

          <div className="warehouse-stock-list">
            {dashboard.warehouseStocks.map((warehouse) => {
              const ratio = Math.round((warehouse.totalQuantity / maxWarehouseStock) * 100)

              return (
                <Link className="warehouse-stock-row" to={`/warehouses/${warehouse.warehouseId}`} key={warehouse.warehouseId}>
                  <div className="warehouse-stock-name"><span className="sku-text">{warehouse.warehouseCode}</span><strong>{warehouse.warehouseName}</strong></div>
                  <div className="warehouse-stock-bar" aria-label={`${warehouse.warehouseName} stok oranı`}><span style={{ width: `${ratio}%` }} /></div>
                  <div className="warehouse-stock-values"><strong>{numberFormatter.format(warehouse.totalQuantity)}</strong><span>{warehouse.productCount} ürün</span></div>
                  <span className={`warehouse-critical-count ${warehouse.criticalStockCount > 0 ? 'has-critical' : ''}`}>{warehouse.criticalStockCount} kritik</span>
                </Link>
              )
            })}

            {dashboard.warehouseStocks.length === 0 && <div className="dashboard-empty"><Warehouse size={24} /><span>Aktif depo bulunmuyor.</span></div>}
          </div>
        </section>

        <aside className="dashboard-panel operation-summary-panel">
          <div className="dashboard-panel-header">
            <div><span className="dashboard-section-icon"><Activity size={18} /></span><div><h2>Operasyon Özeti</h2><p>Güncel sistem durumu</p></div></div>
          </div>
          <Link className="operation-summary-row" to="/warehouses"><span><Building2 size={17} />Aktif depo</span><strong>{dashboard.activeWarehouseCount}</strong></Link>
          <Link className="operation-summary-row" to="/locations"><span><MapPin size={17} />Aktif lokasyon</span><strong>{dashboard.activeLocationCount}</strong></Link>
          <Link className="operation-summary-row" to="/stock-movements"><span><Activity size={17} />Bugünkü hareket</span><strong>{dashboard.todayMovementCount}</strong></Link>
        </aside>
      </div>

      <section className="dashboard-panel recent-movements-panel">
        <div className="dashboard-panel-header">
          <div><span className="dashboard-section-icon"><Activity size={18} /></span><div><h2>Son Stok Hareketleri</h2><p>En son gerçekleşen 8 işlem</p></div></div>
          <Link to="/stock-movements">Tümünü gör <ArrowRight size={15} /></Link>
        </div>

        <div className="table-responsive">
          <table className="table dashboard-movements-table mb-0 align-middle">
            <thead><tr><th>Zaman</th><th>Ürün</th><th>İşlem</th><th>Hareket</th><th className="text-end">Miktar</th></tr></thead>
            <tbody>{dashboard.recentMovements.map((movement) => <MovementRow movement={movement} key={movement.id} />)}</tbody>
          </table>
        </div>
        {dashboard.recentMovements.length === 0 && <div className="dashboard-empty"><Activity size={24} /><span>Henüz stok hareketi bulunmuyor.</span></div>}
      </section>
    </section>
  )
}

function MovementRow({ movement }: { movement: DashboardMovement }) {
  const source = locationText(movement.fromWarehouseName, movement.fromLocationCode)
  const target = locationText(movement.toWarehouseName, movement.toLocationCode)
  const isInbound = !source && Boolean(target)

  return (
    <tr>
      <td>{new Date(movement.createdAtUtc).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td><span className="product-name d-block">{movement.productName}</span><span className="sku-text">{movement.productSku}</span></td>
      <td><span className={`movement-badge ${movement.type.toLowerCase()}`}>{movementLabels[movement.type]}</span></td>
      <td><div className="movement-path">{isInbound ? <ArrowDownToLine size={16} className="movement-in" /> : <ArrowUpFromLine size={16} className="movement-out" />}<span>{source ?? 'Dış kaynak'}</span><ArrowRight size={14} /><span>{target ?? 'Çıkış'}</span></div></td>
      <td className="text-end"><strong>{numberFormatter.format(movement.quantity)}</strong></td>
    </tr>
  )
}

function locationText(warehouse: string | null, location: string | null) {
  if (!location) return null
  return warehouse ? `${warehouse} · ${location}` : location
}

export default DashboardPage
