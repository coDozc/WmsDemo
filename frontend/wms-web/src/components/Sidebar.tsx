import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPin,
  Network,
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
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/offices"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Network size={18} />
          <span>Ofisler</span>
        </NavLink>
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
        <NavLink
          to="/warehouses"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Warehouse size={18} />
          <span>Depolar</span>
        </NavLink>
        <NavLink
          to="/locations"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <MapPin size={18} />
          <span>Lokasyonlar</span>
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Boxes size={18} />
          <span>Stoklar</span>
        </NavLink>

        <div className="nav-section-label nav-section-spaced">Operasyonlar</div>
        <NavLink
          to="/goods-receipts"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Truck size={18} />
          <span>Mal Kabul</span>
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <FileText size={18} />
          <span>Siparişler</span>
        </NavLink>
        <NavLink
          to="/stock-transfers"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Building2 size={18} />
          <span>Transferler</span>
        </NavLink>
        <NavLink
          to="/shipments"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <Send size={18} />
          <span>Sevkiyatlar</span>
        </NavLink>
        <NavLink
          to="/stock-movements"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'is-active' : ''}`
          }
          onClick={onClose}
        >
          <ClipboardList size={18} />
          <span>Stok Hareketleri</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>WMS Demo</span>
        <small>v0.1.0</small>
      </div>
    </aside>
  )
}

export default Sidebar
