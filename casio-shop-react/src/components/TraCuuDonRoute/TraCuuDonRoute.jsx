import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrderLookupPage from '../../pages/OrderLookupPage/OrderLookupPage'

/** Khách: tra cứu công khai. Đã login: chuyển vào khu tài khoản. */
export default function TraCuuDonRoute() {
  const { isLoggedIn, booting } = useAuth()

  if (booting) {
    return <p style={{ textAlign: 'center', padding: 40 }}>Đang tải...</p>
  }

  if (isLoggedIn) {
    return <Navigate to="/tai-khoan/tra-cuu" replace />
  }

  return <OrderLookupPage />
}
