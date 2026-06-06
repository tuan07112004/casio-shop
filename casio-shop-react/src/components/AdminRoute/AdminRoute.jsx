import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute() {
  const { isLoggedIn, isAdmin, booting } = useAuth()

  if (booting) {
    return (
      <div className="admin-route-loading">
        <p>Đang kiểm tra quyền...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/dang-nhap" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}