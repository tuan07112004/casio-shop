import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import ScrollToTop from './components/ScrollToTop'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage/HomePage'
import ShopPage from './pages/ShopPage/ShopPage'
import CartPage from './pages/CartPage/CartPage'
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/cua-hang" element={<ShopPage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/san-pham/:id" element={<ProductDetailPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App
