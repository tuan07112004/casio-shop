import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/dang-nhap')
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell-header">
        <div className="admin-shell-inner">
          <Link to="/admin" className="admin-shell-brand">
            Lytus · Quản trị
          </Link>
          <div className="admin-shell-actions">
            <span className="admin-shell-user">{user?.name}</span>
            <Link to="/" className="admin-shell-link">
              Xem website
            </Link>
            <button type="button" className="admin-shell-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="admin-shell-main">
        <Outlet />
      </main>
    </div>
  )
}