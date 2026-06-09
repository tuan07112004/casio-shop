import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Layout from './components/Layout/Layout'
import AdminRoute from './components/AdminRoute/AdminRoute'
import AdminLayout from './components/AdminLayout/AdminLayout'
import HomePage from './pages/HomePage/HomePage'
import ShopPage from './pages/ShopPage/ShopPage'
import CartPage from './pages/CartPage/CartPage'
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage'
import LoginPage from './pages/LoginPage/LoginPage'
import RegisterPage from './pages/RegisterPage/RegisterPage'
import AdminPage from './pages/AdminPage/AdminPage'
import TinTucPage from './pages/TinTucPage/TinTucPage'
import FAQPage from './pages/FAQPage/FAQPage'
import './App.css'
import CheckoutPage from './pages/CheckoutPage/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage/OrderSuccessPage'
import AdminOrdersPage from './pages/AdminOrdersPage/AdminOrdersPage'
import AdminProductsPage from './pages/AdminProductsPage/AdminProductsPage'
import CustomerRoute from './components/CustomerRoute/CustomerRoute'
import AccountLayout from './components/AccountLayout/AccountLayout'
import AccountOverviewPage from './pages/AccountOverviewPage/AccountOverviewPage'
import MyOrdersPage from './pages/MyOrdersPage/MyOrdersPage'
import TraCuuDonRoute from './components/TraCuuDonRoute/TraCuuDonRoute'
import OrderLookupPage from './pages/OrderLookupPage/OrderLookupPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/cua-hang" element={<ShopPage />} />
              <Route path="/gio-hang" element={<CartPage />} />
              <Route path="/san-pham/:id" element={<ProductDetailPage />} />
              <Route path="/dang-nhap" element={<LoginPage />} />
              <Route path="/dang-ky" element={<RegisterPage />} />
              <Route path="/tin-tuc" element={<TinTucPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/thanh-toan" element={<CheckoutPage />} />
              <Route path="/dat-hang-thanh-cong" element={<OrderSuccessPage />} />
              <Route path="/tra-cuu-don" element={<TraCuuDonRoute />} />
              <Route element={<CustomerRoute />}>
                <Route element={<AccountLayout />}>
                  <Route path="/tai-khoan" element={<AccountOverviewPage />} />
                  <Route path="/tai-khoan/don-hang" element={<MyOrdersPage />} />
                  <Route path="/tai-khoan/tra-cuu" element={<OrderLookupPage />} />
                </Route>
              </Route>
              <Route
                path="/don-hang-cua-toi"
                element={<Navigate to="/tai-khoan/don-hang" replace />}
              />
            </Route>

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/don-hang" element={<AdminOrdersPage />} />
                <Route path="/admin/san-pham" element={<AdminProductsPage />} />
              </Route>
            </Route>

          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App