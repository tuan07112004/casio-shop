import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CustomerRoute() {
  const { isLoggedIn, booting } = useAuth()

  if (booting) {
    return (
      <div className="admin-route-loading">
        <p>Đang tải...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/dang-nhap" replace />
  }

  return <Outlet />
}
