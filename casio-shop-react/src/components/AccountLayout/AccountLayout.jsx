import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AccountLayout.css'

const accountNav = [
  { to: '/tai-khoan', label: 'Tổng quan', end: true },
  { to: '/tai-khoan/don-hang', label: 'Đơn hàng của tôi' },
  { to: '/tai-khoan/tra-cuu', label: 'Tra cứu đơn hàng' },
]

export default function AccountLayout() {
  const { user } = useAuth()

  return (
    <div className="account-shell">
      <aside className="account-sidebar" aria-label="Menu tài khoản">
        <div className="account-user-card">
          <span className="account-user-avatar" aria-hidden>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </span>
          <div className="account-user-info">
            <strong>{user?.name}</strong>
            {user?.email && <span>{user.email}</span>}
          </div>
        </div>

        <nav className="account-nav">
          {accountNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `account-nav-link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="account-sidebar-foot">
          <Link to="/cua-hang" className="account-sidebar-link">
            ← Về cửa hàng
          </Link>
        </div>
      </aside>

      <div className="account-main">
        <Outlet />
      </div>
    </div>
  )
}
