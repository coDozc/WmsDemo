import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import InventoryPage from './pages/InventoryPage'
import LocationsPage from './pages/LocationsPage'
import ProductsPage from './pages/ProductsPage'
import StockMovementsPage from './pages/StockMovementsPage'
import WarehousesPage from './pages/WarehousesPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="stock-movements" element={<StockMovementsPage />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Route>
    </Routes>
  )
}

export default App
