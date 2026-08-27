import {
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Send,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

type NavItem = {
  label: string
  icon: typeof Package
}

const managementItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Depolar', icon: Warehouse },
  { label: 'Lokasyonlar', icon: MapPin },
  { label: 'Stoklar', icon: Boxes },
]

const operationItems: NavItem[] = [
  { label: 'Mal Kabul', icon: Truck },
  { label: 'Transferler', icon: Building2 },
  { label: 'Sevkiyatlar', icon: Send },
  { label: 'Stok Hareketleri', icon: ClipboardList },
]

function DisabledNavItems({ items }: { items: NavItem[] }) {
  return items.map(({ label, icon: Icon }) => (
    <span className="sidebar-link is-disabled" aria-disabled="true" key={label}>
      <Icon size={18} />
      <span>{label}</span>
    </span>
  ))
}

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <Package size={21} />
        </div>
        <div>
          <strong>WMS Demo</strong>
          <span>Depo Yönetimi</span>
        </div>
        <button
          type="button"
          className="icon-button sidebar-close"
          title="Menüyü kapat"
          aria-label="Menüyü kapat"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Ana menü">
        <div className="nav-section-label">Yönetim</div>
        <DisabledNavItems items={managementItems.slice(0, 1)} />
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Package size={18} />
          <span>Ürünler</span>
        </NavLink>
        <DisabledNavItems items={managementItems.slice(1)} />

        <div className="nav-section-label nav-section-spaced">Operasyonlar</div>
        <DisabledNavItems items={operationItems} />
      </nav>

      <div className="sidebar-footer">
        <span>WMS Demo</span>
        <small>v0.1.0</small>
      </div>
    </aside>
  )
}

export default Sidebar
