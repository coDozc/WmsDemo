import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import GoodsReceiptsPage from './pages/GoodsReceiptsPage'
import InventoryPage from './pages/InventoryPage'
import LocationsPage from './pages/LocationsPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import ShipmentsPage from './pages/ShipmentsPage'
import StockMovementsPage from './pages/StockMovementsPage'
import StockTransfersPage from './pages/StockTransfersPage'
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
        <Route path="orders" element={<OrdersPage />} />
        <Route path="goods-receipts" element={<GoodsReceiptsPage />} />
        <Route path="stock-transfers" element={<StockTransfersPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="stock-movements" element={<StockMovementsPage />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Route>
    </Routes>
  )
}

export default App
