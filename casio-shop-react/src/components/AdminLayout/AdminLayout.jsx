import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AdminToastProvider } from '../../context/AdminToastContext'
import AdminSidebar from '../AdminSidebar/AdminSidebar'
import './AdminLayout.css'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/dang-nhap')
  }

  return (
    <AdminToastProvider>
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/admin" className="admin-topbar-brand">
            <img
              src="/images/logo.png"
              alt="Lytus"
              className="admin-topbar-logo"
            />
            <span className="admin-topbar-brand-sub">Trang admin</span>
          </Link>
          <div className="admin-topbar-actions">
            <span className="admin-topbar-user">{user?.name}</span>
            <Link to="/" className="admin-topbar-link">
              Xem website
            </Link>
            <button type="button" className="admin-topbar-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <AdminSidebar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
    </AdminToastProvider>
  )
}
