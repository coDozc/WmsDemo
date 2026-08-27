import {
  CircleAlert,
  PackageOpen,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createProduct,
  deactivateProduct,
  getProducts,
  updateProduct,
} from '../api/productApi'
import type { Product } from '../types/product'

type StatusFilter = 'all' | 'active' | 'inactive'

type ProductFormState = {
  sku: string
  name: string
  barcode: string
  isActive: boolean
}

const emptyForm: ProductFormState = {
  sku: '',
  name: '',
  barcode: '',
  isActive: true,
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)

    try {
      setProducts(await getProducts())
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ürünler alınamadı.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return products.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        product.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        product.sku.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        product.barcode?.toLocaleLowerCase('tr-TR').includes(normalizedQuery)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'inactive' && !product.isActive)

      return Boolean(matchesSearch && matchesStatus)
    })
  }, [products, query, statusFilter])

  function openCreateForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setForm({
      sku: product.sku,
      name: product.name,
      barcode: product.barcode ?? '',
      isActive: product.isActive,
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          sku: form.sku,
          name: form.name,
          barcode: form.barcode || null,
          isActive: form.isActive,
        })
      } else {
        await createProduct({
          sku: form.sku,
          name: form.name,
          barcode: form.barcode || null,
        })
      }

      setFormOpen(false)
      await loadProducts()
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : 'İşlem tamamlanamadı.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(product: Product) {
    const confirmed = window.confirm(
      `${product.name} ürünü pasife alınsın mı?`,
    )

    if (!confirmed) return

    try {
      await deactivateProduct(product.id)
      await loadProducts()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ürün pasife alınamadı.',
      )
    }
  }

  return (
    <section className="products-page">
      <div className="page-toolbar">
        <div className="search-control">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="form-control"
            placeholder="SKU, ürün veya barkod ara"
            aria-label="Ürünlerde ara"
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
          onClick={() => void loadProducts()}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>

        <button type="button" className="btn btn-dark add-button" onClick={openCreateForm}>
          <Plus size={18} />
          Yeni Ürün
        </button>
      </div>

      <div className="list-meta">
        <span>{visibleProducts.length} ürün</span>
        <span className="list-meta-separator" />
        <span>{products.filter((product) => product.isActive).length} aktif</span>
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
                <th>SKU</th>
                <th>Ürün</th>
                <th>Barkod</th>
                <th>Durum</th>
                <th>Oluşturma</th>
                <th className="text-end">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td><span className="sku-text">{product.sku}</span></td>
                    <td className="product-name">{product.name}</td>
                    <td>{product.barcode || <span className="muted-value">Yok</span>}</td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>{new Date(product.createdAtUtc).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Ürünü düzenle"
                          aria-label={`${product.name} ürününü düzenle`}
                          onClick={() => openEditForm(product)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          title="Ürünü pasife al"
                          aria-label={`${product.name} ürününü pasife al`}
                          onClick={() => void handleDeactivate(product)}
                          disabled={!product.isActive}
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
            <span>Ürünler yükleniyor</span>
          </div>
        )}

        {!loading && visibleProducts.length === 0 && (
          <div className="table-state">
            <PackageOpen size={28} />
            <strong>Ürün bulunamadı</strong>
            <span>Filtreleri değiştirin veya yeni ürün ekleyin.</span>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
            <div className="dialog-header">
              <div>
                <span className="dialog-kicker">Ürün kartı</span>
                <h2 id="product-dialog-title">
                  {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün'}
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

                <div className="mb-3">
                  <label className="form-label" htmlFor="product-sku">SKU</label>
                  <input
                    id="product-sku"
                    className="form-control"
                    maxLength={50}
                    required
                    autoFocus
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="product-name">Ürün adı</label>
                  <input
                    id="product-name"
                    className="form-control"
                    maxLength={200}
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="product-barcode">Barkod</label>
                  <input
                    id="product-barcode"
                    className="form-control"
                    maxLength={100}
                    value={form.barcode}
                    onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                  />
                </div>

                {editingProduct && (
                  <div className="form-check form-switch">
                    <input
                      id="product-active"
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="product-active">Aktif ürün</label>
                  </div>
                )}
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

export default ProductsPage
