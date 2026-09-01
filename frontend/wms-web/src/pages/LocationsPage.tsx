import {
  CircleAlert,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createLocation,
  deactivateLocation,
  getLocations,
  updateLocation,
} from '../api/locationApi'
import { getWarehouses } from '../api/warehouseApi'
import type { Location, LocationType } from '../types/location'
import type { Warehouse } from '../types/warehouse'

type StatusFilter = 'all' | 'active' | 'inactive'

type LocationFormState = {
  code: string
  name: string
  type: LocationType
  isActive: boolean
}

const emptyForm: LocationFormState = {
  code: '',
  name: '',
  type: 'Storage',
  isActive: true,
}

const typeLabels: Record<LocationType, string> = {
  Receiving: 'Mal kabul',
  Storage: 'Depolama',
  Shipping: 'Sevkiyat',
}

function LocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [form, setForm] = useState<LocationFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === selectedWarehouseId,
  )

  useEffect(() => {
    async function loadWarehouseOptions() {
      setLoading(true)
      setError(null)

      try {
        const result = await getWarehouses()
        setWarehouses(result)

        const requestedId = Number(searchParams.get('warehouseId'))
        const requestedWarehouse = result.find((warehouse) => warehouse.id === requestedId)
        const initialWarehouse = requestedWarehouse ?? result.find((warehouse) => warehouse.isActive) ?? result[0]

        if (initialWarehouse) {
          setSelectedWarehouseId(initialWarehouse.id)
          setSearchParams({ warehouseId: String(initialWarehouse.id) }, { replace: true })
        } else {
          setLoading(false)
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Depolar alınamadı.')
        setLoading(false)
      }
    }

    void loadWarehouseOptions()
    // The initial query value is only used while preparing the first selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadLocations(warehouseId: number) {
    setLoading(true)
    setError(null)

    try {
      setLocations(await getLocations(warehouseId))
    } catch (requestError) {
      setLocations([])
      setError(requestError instanceof Error ? requestError.message : 'Lokasyonlar alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedWarehouseId !== null) {
      void loadLocations(selectedWarehouseId)
    }
  }, [selectedWarehouseId])

  const visibleLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return locations.filter((location) => {
      const matchesSearch =
        !normalizedQuery ||
        location.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        location.code.toLocaleLowerCase('tr-TR').includes(normalizedQuery)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && location.isActive) ||
        (statusFilter === 'inactive' && !location.isActive)

      return matchesSearch && matchesStatus
    })
  }, [locations, query, statusFilter])

  function selectWarehouse(value: string) {
    const warehouseId = Number(value)
    setSelectedWarehouseId(warehouseId)
    setSearchParams({ warehouseId: value })
  }

  function openCreateForm() {
    setEditingLocation(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(location: Location) {
    setEditingLocation(location)
    setForm({
      code: location.code,
      name: location.name,
      type: location.type,
      isActive: location.isActive,
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedWarehouseId === null) return

    setSaving(true)
    setFormError(null)

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, form)
      } else {
        await createLocation(selectedWarehouseId, {
          code: form.code,
          name: form.name,
          type: form.type,
        })
      }

      setFormOpen(false)
      await loadLocations(selectedWarehouseId)
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(location: Location) {
    if (!window.confirm(`${location.name} lokasyonu pasife alınsın mı?`)) return

    try {
      await deactivateLocation(location.id)
      if (selectedWarehouseId !== null) await loadLocations(selectedWarehouseId)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Lokasyon pasife alınamadı.')
    }
  }

  return (
    <section>
      <div className="page-toolbar locations-toolbar">
        <select
          className="form-select warehouse-filter"
          aria-label="Depo seç"
          value={selectedWarehouseId ?? ''}
          onChange={(event) => selectWarehouse(event.target.value)}
          disabled={warehouses.length === 0}
        >
          {warehouses.length === 0 && <option value="">Depo bulunamadı</option>}
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} · {warehouse.name}{warehouse.isActive ? '' : ' (Pasif)'}
            </option>
          ))}
        </select>

        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="form-control"
            placeholder="Lokasyon kodu veya adı ara"
            aria-label="Lokasyonlarda ara"
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
          onClick={() => selectedWarehouseId !== null && void loadLocations(selectedWarehouseId)}
          disabled={loading || selectedWarehouseId === null}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>

        <button
          type="button"
          className="btn btn-dark add-button"
          onClick={openCreateForm}
          disabled={!selectedWarehouse?.isActive}
          title={selectedWarehouse?.isActive ? 'Yeni lokasyon' : 'Aktif bir depo seçin'}
        >
          <Plus size={18} />
          Yeni Lokasyon
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleLocations.length} lokasyon</span>
        <span className="list-meta-separator" />
        <span>{locations.filter((location) => location.isActive).length} aktif</span>
        {selectedWarehouse && (
          <>
            <span className="list-meta-separator" />
            <span>{selectedWarehouse.name}</span>
          </>
        )}
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
                <th>Lokasyon kodu</th>
                <th>Lokasyon adı</th>
                <th>Tip</th>
                <th>Durum</th>
                <th>Oluşturma</th>
                <th className="text-end">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleLocations.map((location) => (
                <tr key={location.id}>
                  <td><span className="sku-text">{location.code}</span></td>
                  <td className="product-name">{location.name}</td>
                  <td><span className={`type-badge ${location.type.toLowerCase()}`}>{typeLabels[location.type]}</span></td>
                  <td>
                    <span className={`status-badge ${location.isActive ? 'active' : 'inactive'}`}>
                      {location.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{new Date(location.createdAtUtc).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-button" title="Lokasyonu düzenle" aria-label={`${location.name} lokasyonunu düzenle`} onClick={() => openEditForm(location)}>
                        <Pencil size={17} />
                      </button>
                      <button type="button" className="icon-button danger" title="Lokasyonu pasife al" aria-label={`${location.name} lokasyonunu pasife al`} onClick={() => void handleDeactivate(location)} disabled={!location.isActive}>
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
            <span>Lokasyonlar yükleniyor</span>
          </div>
        )}

        {!loading && visibleLocations.length === 0 && (
          <div className="table-state">
            <MapPin size={28} />
            <strong>Lokasyon bulunamadı</strong>
            <span>{warehouses.length === 0 ? 'Önce bir depo oluşturun.' : 'Filtreleri değiştirin veya yeni lokasyon ekleyin.'}</span>
          </div>
        )}
      </div>

      {formOpen && selectedWarehouse && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="location-dialog-title">
            <div className="dialog-header">
              <div>
                <span className="dialog-kicker">{selectedWarehouse.code} · {selectedWarehouse.name}</span>
                <h2 id="location-dialog-title">{editingLocation ? 'Lokasyonu Düzenle' : 'Yeni Lokasyon'}</h2>
              </div>
              <button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <div className="mb-3">
                  <label className="form-label" htmlFor="location-code">Lokasyon kodu</label>
                  <input id="location-code" className="form-control" maxLength={50} required autoFocus value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="location-name">Lokasyon adı</label>
                  <input id="location-name" className="form-control" maxLength={200} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="location-type">Lokasyon tipi</label>
                  <select id="location-type" className="form-select" required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LocationType })}>
                    <option value="Receiving">Mal kabul</option>
                    <option value="Storage">Depolama</option>
                    <option value="Shipping">Sevkiyat</option>
                  </select>
                </div>

                {editingLocation && (
                  <div className="form-check form-switch">
                    <input id="location-active" className="form-check-input" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                    <label className="form-check-label" htmlFor="location-active">Aktif lokasyon</label>
                  </div>
                )}
              </div>

              <div className="dialog-footer">
                <button type="button" className="btn btn-light" onClick={() => setFormOpen(false)}>İptal</button>
                <button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default LocationsPage
