import { Menu, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = location.pathname.startsWith('/warehouses')
    ? 'Depolar'
    : location.pathname.startsWith('/locations')
      ? 'Lokasyonlar'
      : location.pathname.startsWith('/stock-movements')
        ? 'Stok Hareketleri'
        : location.pathname.startsWith('/inventory')
          ? 'Stoklar'
          : 'Ürünler'

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            type="button"
            title="Menüyü aç"
            aria-label="Menüyü aç"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="topbar-eyebrow">Operasyon yönetimi</div>
            <h1>{pageTitle}</h1>
          </div>

          <div className="user-summary" title="Oturum bilgisi">
            <span className="user-icon" aria-hidden="true">
              <UserRound size={17} />
            </span>
            <span className="user-copy">
              <strong>Demo Kullanıcı</strong>
              <small>Depo Yöneticisi</small>
            </span>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
