import {
  CircleAlert,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createWarehouse,
  deactivateWarehouse,
  getWarehouses,
  updateWarehouse,
} from '../api/warehouseApi'
import type { Warehouse } from '../types/warehouse'

type StatusFilter = 'all' | 'active' | 'inactive'

type WarehouseFormState = {
  code: string
  name: string
  isActive: boolean
}

const emptyForm: WarehouseFormState = {
  code: '',
  name: '',
  isActive: true,
}

function WarehousesPage() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [form, setForm] = useState<WarehouseFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadWarehouses() {
    setLoading(true)
    setError(null)

    try {
      setWarehouses(await getWarehouses())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Depolar alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialWarehouses() {
      await loadWarehouses()
    }

    void loadInitialWarehouses()
  }, [])

  const visibleWarehouses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return warehouses.filter((warehouse) => {
      const matchesSearch =
        !normalizedQuery ||
        warehouse.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        warehouse.code.toLocaleLowerCase('tr-TR').includes(normalizedQuery)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && warehouse.isActive) ||
        (statusFilter === 'inactive' && !warehouse.isActive)

      return matchesSearch && matchesStatus
    })
  }, [warehouses, query, statusFilter])

  function openCreateForm() {
    setEditingWarehouse(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(warehouse: Warehouse) {
    setEditingWarehouse(warehouse)
    setForm({
      code: warehouse.code,
      name: warehouse.name,
      isActive: warehouse.isActive,
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, form)
      } else {
        await createWarehouse({ code: form.code, name: form.name })
      }

      setFormOpen(false)
      await loadWarehouses()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(warehouse: Warehouse) {
    if (!window.confirm(`${warehouse.name} deposu pasife alınsın mı?`)) return

    try {
      await deactivateWarehouse(warehouse.id)
      await loadWarehouses()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Depo pasife alınamadı.')
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="form-control"
            placeholder="Depo kodu veya adı ara"
            aria-label="Depolarda ara"
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
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>

        <button
          type="button"
          className="icon-button toolbar-refresh"
          title="Listeyi yenile"
          aria-label="Listeyi yenile"
          onClick={() => void loadWarehouses()}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>

        <button type="button" className="btn btn-dark add-button" onClick={openCreateForm}>
          <Plus size={18} />
          Yeni Depo
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleWarehouses.length} depo</span>
        <span className="list-meta-separator" />
        <span>{warehouses.filter((warehouse) => warehouse.isActive).length} aktif</span>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Depo kodu</th>
                <th>Depo adı</th>
                <th>Durum</th>
                <th>Oluşturma</th>
                <th className="text-end">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleWarehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td><Link className="warehouse-table-link sku-text" to={`/warehouses/${warehouse.id}`}>{warehouse.code}</Link></td>
                  <td className="product-name"><Link className="warehouse-table-link" to={`/warehouses/${warehouse.id}`}>{warehouse.name}</Link></td>
                  <td>
                    <span className={`status-badge ${warehouse.isActive ? 'active' : 'inactive'}`}>
                      {warehouse.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{new Date(warehouse.createdAtUtc).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Lokasyonları aç"
                        aria-label={`${warehouse.name} lokasyonlarını aç`}
                        onClick={() => navigate(`/locations?warehouseId=${warehouse.id}`)}
                      >
                        <MapPin size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        title="Depoyu düzenle"
                        aria-label={`${warehouse.name} deposunu düzenle`}
                        onClick={() => openEditForm(warehouse)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        title="Depoyu pasife al"
                        aria-label={`${warehouse.name} deposunu pasife al`}
                        onClick={() => void handleDeactivate(warehouse)}
                        disabled={!warehouse.isActive}
                      >
                        <Power size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="table-state">
            <RefreshCw className="spin" size={22} />
            <span>Depolar yükleniyor</span>
          </div>
        )}

        {!loading && visibleWarehouses.length === 0 && (
          <div className="table-state">
            <WarehouseIcon size={28} />
            <strong>Depo bulunamadı</strong>
            <span>Filtreleri değiştirin veya yeni depo ekleyin.</span>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="warehouse-dialog-title">
            <div className="dialog-header">
              <div>
                <span className="dialog-kicker">Depo kartı</span>
                <h2 id="warehouse-dialog-title">
                  {editingWarehouse ? 'Depoyu Düzenle' : 'Yeni Depo'}
                </h2>
              </div>
              <button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <div className="mb-3">
                  <label className="form-label" htmlFor="warehouse-code">Depo kodu</label>
                  <input
                    id="warehouse-code"
                    className="form-control"
                    maxLength={50}
                    required
                    autoFocus
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="warehouse-name">Depo adı</label>
                  <input
                    id="warehouse-name"
                    className="form-control"
                    maxLength={200}
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>

                {editingWarehouse && (
                  <div className="form-check form-switch">
                    <input
                      id="warehouse-active"
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="warehouse-active">Aktif depo</label>
                  </div>
                )}
              </div>

              <div className="dialog-footer">
                <button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button>
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

export default WarehousesPage
