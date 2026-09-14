import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CircleAlert,
  MapPin,
  RefreshCw,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOfficeById } from '../api/officeApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Office, OfficeType } from '../types/office'
import type { Warehouse } from '../types/warehouse'

const officeTypeLabels: Record<OfficeType, string> = {
  Headquarters: 'Merkez',
  Regional: 'Bölge',
  Branch: 'Şube',
}

function OfficeDetailPage() {
  const { officeId } = useParams()
  const id = Number(officeId)
  const [office, setOffice] = useState<Office | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadOfficeDetails() {
    if (!Number.isInteger(id) || id < 1) {
      setError('Geçersiz ofis numarası.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [officeResult, warehouseResult] = await Promise.all([
        getOfficeById(id),
        getWarehouses(id),
      ])

      setOffice(officeResult)
      setWarehouses(warehouseResult)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ofis detayı alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialOfficeDetails() {
      await Promise.resolve()

      if (!Number.isInteger(id) || id < 1) {
        setError('Geçersiz ofis numarası.')
        setLoading(false)
        return
      }

      try {
        const [officeResult, warehouseResult] = await Promise.all([
          getOfficeById(id),
          getWarehouses(id),
        ])

        setOffice(officeResult)
        setWarehouses(warehouseResult)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Ofis detayı alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitialOfficeDetails()
  }, [id])

  const activeWarehouseCount = warehouses.filter((warehouse) => warehouse.isActive).length
  const inactiveWarehouseCount = warehouses.length - activeWarehouseCount

  if (!loading && !office) {
    return (
      <section>
        <Link className="detail-back-link" to="/offices">
          <ArrowLeft size={16} /> Ofislere dön
        </Link>
        <div className="alert alert-danger d-flex align-items-center gap-2 mt-3" role="alert">
          <CircleAlert size={18} />
          <span>{error ?? 'Ofis bulunamadı.'}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="office-detail-page">
      <div className="detail-page-actions">
        <Link className="detail-back-link" to="/offices">
          <ArrowLeft size={16} /> Ofislere dön
        </Link>
        <button
          type="button"
          className="icon-button toolbar-refresh"
          title="Ofis detayını yenile"
          aria-label="Ofis detayını yenile"
          onClick={() => void loadOfficeDetails()}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && office && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="office-detail-header">
        <div className="office-detail-identity">
          <span className="office-detail-icon"><Building2 size={22} /></span>
          <div>
            <span className="sku-text">{office?.code ?? '...'}</span>
            <h2>{office?.name ?? 'Ofis yükleniyor'}</h2>
            {office && (
              <div className="office-detail-meta">
                <span><MapPin size={14} /> {office.city}{office.district ? ` / ${office.district}` : ''}</span>
                <span>{officeTypeLabels[office.type]}</span>
              </div>
            )}
          </div>
          {office && (
            <span className={`status-badge ${office.isActive ? 'active' : 'inactive'}`}>
              {office.isActive ? 'Aktif' : 'Pasif'}
            </span>
          )}
        </div>

        <div className="office-metrics" aria-label="Ofis özeti">
          <div><span>Toplam depo</span><strong>{warehouses.length}</strong><small>bağlı</small></div>
          <div><span>Aktif depo</span><strong>{activeWarehouseCount}</strong><small>kullanımda</small></div>
          <div><span>Pasif depo</span><strong>{inactiveWarehouseCount}</strong><small>kapalı</small></div>
        </div>
      </div>

      <div className="detail-section-heading">
        <div>
          <span className="detail-section-icon"><WarehouseIcon size={18} /></span>
          <div><h3>Bağlı Depolar</h3><p>Bu ofis tarafından yönetilen depolar.</p></div>
        </div>
        <span>{warehouses.length} depo</span>
      </div>

      <div className="table-shell office-warehouses-shell">
        <div className="table-responsive">
          <table className="table products-table office-warehouses-table mb-0 align-middle">
            <thead>
              <tr><th>Depo kodu</th><th>Depo adı</th><th>Durum</th><th>Oluşturma</th><th aria-label="Detay" /></tr>
            </thead>
            <tbody>
              {!loading && warehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td><Link className="office-warehouse-link sku-text" to={`/warehouses/${warehouse.id}`}>{warehouse.code}</Link></td>
                  <td className="product-name"><Link className="office-warehouse-link" to={`/warehouses/${warehouse.id}`}>{warehouse.name}</Link></td>
                  <td><span className={`status-badge ${warehouse.isActive ? 'active' : 'inactive'}`}>{warehouse.isActive ? 'Aktif' : 'Pasif'}</span></td>
                  <td>{new Date(warehouse.createdAtUtc).toLocaleDateString('tr-TR')}</td>
                  <td className="text-end"><Link className="icon-button" title="Depoyu aç" aria-label={`${warehouse.name} deposunu aç`} to={`/warehouses/${warehouse.id}`}><ArrowUpRight size={17} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Ofis bilgileri yükleniyor</span></div>}
        {!loading && warehouses.length === 0 && <div className="table-state"><WarehouseIcon size={28} /><strong>Bağlı depo bulunamadı</strong><span>Bu ofise henüz depo eklenmemiş.</span></div>}
      </div>
    </section>
  )
}

export default OfficeDetailPage
