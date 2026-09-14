import {
  Building2,
  CircleAlert,
  MapPin,
  Plus,
  RefreshCw,
  Warehouse,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createOffice, getOffices } from '../api/officeApi'
import type { Office, OfficeType } from '../types/office'

const officeTypeLabels: Record<OfficeType, string> = {
  Headquarters: 'Merkez',
  Regional: 'Bölge',
  Branch: 'Şube',
}

const emptyForm = {
  code: '',
  name: '',
  city: '',
  district: '',
  type: 'Regional' as OfficeType,
}

function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadOffices() {
    setLoading(true)
    setError(null)

    try {
      setOffices(await getOffices())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ofisler alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialOffices() {
      await Promise.resolve()
      await loadOffices()
    }

    void loadInitialOffices()
  }, [])

  function openCreateForm() {
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      await createOffice(form)
      setFormOpen(false)
      await loadOffices()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'İşlem tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  const activeOfficeCount = offices.filter((office) => office.isActive).length
  const warehouseCount = offices.reduce((total, office) => total + office.warehouseCount, 0)

  return (
    <section>
      <div className="structure-toolbar offices-toolbar">
        <div className="office-heading">
          <span className="structure-icon"><Building2 size={21} /></span>
          <div><span>Şirket yapısı</span><strong>Ofisler</strong></div>
        </div>
        <button type="button" className="icon-button toolbar-refresh" title="Listeyi yenile" aria-label="Listeyi yenile" onClick={() => void loadOffices()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
        <button type="button" className="btn btn-dark add-button" onClick={openCreateForm}>
          <Plus size={18} /> Yeni Ofis
        </button>
      </div>

      <div className="structure-summary office-summary">
        <div><span>Toplam ofis</span><strong>{offices.length}</strong></div>
        <div><span>Aktif ofis</span><strong>{activeOfficeCount}</strong></div>
        <div><span>Bağlı depo</span><strong>{warehouseCount}</strong></div>
      </div>

      <div className="list-meta"><span>{offices.length} ofis</span><span className="list-meta-separator" /><span>{activeOfficeCount} aktif</span></div>

      {error && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="table-shell">
        <div className="table-responsive">
          <table className="table products-table mb-0 align-middle">
            <thead><tr><th>Ofis kodu</th><th>Ofis adı</th><th>Tip</th><th>Konum</th><th className="text-end">Depo</th><th>Durum</th></tr></thead>
            <tbody>
              {!loading && offices.map((office) => (
                <tr key={office.id}>
                  <td>
                    <Link className="office-warehouse-link sku-text" to={`/offices/${office.id}`}>
                      {office.code}
                    </Link>
                  </td>
                  <td>
                    <Link className="office-warehouse-link" to={`/offices/${office.id}`}>
                      {office.name}
                    </Link>
                  </td>
                  <td><span className="type-badge">{officeTypeLabels[office.type]}</span></td>
                  <td><span className="office-location"><MapPin size={15} />{office.city}{office.district ? ` / ${office.district}` : ''}</span></td>
                  <td className="text-end"><strong>{office.warehouseCount}</strong></td>
                  <td><span className={`status-badge ${office.isActive ? 'active' : 'inactive'}`}>{office.isActive ? 'Aktif' : 'Pasif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="table-state"><RefreshCw className="spin" size={22} /><span>Ofisler yükleniyor</span></div>}
        {!loading && offices.length === 0 && <div className="table-state"><Warehouse size={28} /><strong>Ofis bulunamadı</strong><span>İlk ofisi oluşturarak başlayın.</span></div>}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="office-dialog-title">
            <div className="dialog-header"><div><span className="dialog-kicker">Şirket yapısı</span><h2 id="office-dialog-title">Yeni Ofis</h2></div><button type="button" className="icon-button" title="Formu kapat" aria-label="Formu kapat" onClick={() => setFormOpen(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="dialog-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="office-form-grid">
                  <div><label className="form-label" htmlFor="office-code">Ofis kodu</label><input id="office-code" className="form-control" maxLength={50} required autoFocus value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></div>
                  <div><label className="form-label" htmlFor="office-type">Ofis tipi</label><select id="office-type" className="form-select" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as OfficeType })}><option value="Headquarters">Merkez</option><option value="Regional">Bölge</option><option value="Branch">Şube</option></select></div>
                  <div className="office-form-wide"><label className="form-label" htmlFor="office-name">Ofis adı</label><input id="office-name" className="form-control" maxLength={200} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                  <div><label className="form-label" htmlFor="office-city">İl</label><input id="office-city" className="form-control" maxLength={100} required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
                  <div><label className="form-label" htmlFor="office-district">İlçe</label><input id="office-district" className="form-control" maxLength={100} value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></div>
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

export default OfficesPage
