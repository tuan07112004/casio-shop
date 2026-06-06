import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetchOrderStats } from '../../api/orders'
import AdminStats from '../../components/AdminStats/AdminStats'
import './AdminPage.css'

export default function AdminPage() {
  const { user, logout, token } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiFetchOrderStats(token)
      .then(setStats)
      .catch(() => {})
  }, [token])

  return (
    <div className="admin-page">
      <div className="admin-card admin-card--wide">
        <p className="admin-badge">Quản trị viên</p>
        <h1 className="admin-title">Trang Admin</h1>
        <p className="admin-welcome">
          Xin chào, <strong>{user?.name}</strong> ({user?.email})
        </p>
        <p className="admin-desc">
          Quản lý sản phẩm và đơn hàng cửa hàng Lytus Casio.
        </p>

        <AdminStats stats={stats} />

        <ul className="admin-menu">
          <li>
            <Link to="/admin/san-pham" className="admin-menu-label">
              Quản lý sản phẩm
            </Link>
            <span className="admin-menu-arrow">→</span>
          </li>
          <li>
            <Link to="/admin/don-hang" className="admin-menu-label">
              Đơn hàng &amp; doanh thu
            </Link>
            <span className="admin-menu-arrow">→</span>
          </li>
        </ul>

        <div className="admin-actions">
          <Link to="/" className="admin-btn admin-btn--secondary">
            Về trang chủ
          </Link>
          <Link to="/cua-hang" className="admin-btn admin-btn--secondary">
            Xem cửa hàng
          </Link>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => logout()}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}
