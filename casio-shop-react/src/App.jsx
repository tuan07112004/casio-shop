import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { QuickViewProvider } from './context/QuickViewContext'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Layout from './components/Layout/Layout'
import AdminRoute from './components/AdminRoute/AdminRoute'
import AdminLayout from './components/AdminLayout/AdminLayout'
import CustomerRoute from './components/CustomerRoute/CustomerRoute'
import ShopBuyerRoute from './components/ShopBuyerRoute/ShopBuyerRoute'
import AccountLayout from './components/AccountLayout/AccountLayout'
import './App.css'

const HomePage = lazy(() => import('./pages/HomePage/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage/ShopPage'))
const CartPage = lazy(() => import('./pages/CartPage/CartPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage/ProductDetailPage'))
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage/RegisterPage'))
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'))
const TinTucPage = lazy(() => import('./pages/TinTucPage/TinTucPage'))
const FAQPage = lazy(() => import('./pages/FAQPage/FAQPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage/OrderSuccessPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage/AdminOrdersPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage/AdminProductsPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage/AdminAnalyticsPage'))
const AdminPlaceholderPage = lazy(() => import('./pages/AdminPlaceholderPage/AdminPlaceholderPage'))
const AdminVouchersPage = lazy(() => import('./pages/AdminVouchersPage/AdminVouchersPage'))
const AdminPromotionsPage = lazy(() => import('./pages/AdminPromotionsPage/AdminPromotionsPage'))
const AccountOverviewPage = lazy(() => import('./pages/AccountOverviewPage/AccountOverviewPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage/MyOrdersPage'))
const TraCuuDonRoute = lazy(() => import('./components/TraCuuDonRoute/TraCuuDonRoute'))
const OrderLookupPage = lazy(() => import('./pages/OrderLookupPage/OrderLookupPage'))

function PageLoader() {
  return (
    <div style={{ padding: '48px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.5)' }}>
      Đang tải...
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CategoriesProvider>
          <CartProvider>
            <QuickViewProvider>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cua-hang" element={<ShopPage />} />
                  <Route element={<ShopBuyerRoute />}>
                    <Route path="/gio-hang" element={<CartPage />} />
                    <Route path="/thanh-toan" element={<CheckoutPage />} />
                    <Route path="/dat-hang-thanh-cong" element={<OrderSuccessPage />} />
                  </Route>
                  <Route path="/san-pham/:id" element={<ProductDetailPage />} />
                  <Route path="/dang-nhap" element={<LoginPage />} />
                  <Route path="/dang-ky" element={<RegisterPage />} />
                  <Route path="/tin-tuc" element={<TinTucPage />} />
                  <Route path="/faq" element={<FAQPage />} />
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
                    <Route path="/admin/ma-giam-gia" element={<AdminVouchersPage />} />
                    <Route path="/admin/khuyen-mai" element={<AdminPromotionsPage />} />
                    <Route path="/admin/phan-tich" element={<AdminAnalyticsPage />} />
                    <Route path="/admin/san-pham" element={<AdminProductsPage />} />
                    <Route path="/admin/san-pham/them" element={<AdminProductsPage addMode />} />
                    <Route
                      path="/admin/chat"
                      element={
                        <AdminPlaceholderPage
                          title="Quản lý chat"
                          description="Tính năng chat với khách hàng đang được phát triển."
                        />
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            </QuickViewProvider>
          </CartProvider>
        </CategoriesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
