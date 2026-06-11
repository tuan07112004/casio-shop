import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Giỏ hàng / thanh toán — chỉ dành cho khách, không phải admin. */
export default function ShopBuyerRoute() {
  const { isAdmin, booting } = useAuth()

  if (booting) {
    return (
      <div className="admin-route-loading">
        <p>Đang tải...</p>
      </div>
    )
  }

  if (isAdmin) {
    return <Navigate to="/cua-hang" replace />
  }

  return <Outlet />
}
