import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetchOrderStats } from '../../api/orders'
import { formatPrice } from '../../utils/format'
import './AdminPage.css'

const POLL_MS = 15000

export default function AdminPage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)

  const loadStats = useCallback(
    (silent = false) => {
      if (!token) return
      apiFetchOrderStats(token)
        .then(setStats)
        .catch(() => {})
    },
    [token],
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const poll = setInterval(() => loadStats(true), POLL_MS)
    return () => clearInterval(poll)
  }, [loadStats])

  const orderCards = stats
    ? [
        {
          label: 'Chờ lấy hàng',
          value: stats.to_ship_orders ?? stats.pending_orders ?? 0,
          to: '/admin/don-hang',
        },
        {
          label: 'Đã xử lý',
          value: stats.processed_orders ?? stats.completed_orders ?? 0,
          to: '/admin/don-hang',
        },
        {
          label: 'Đơn trả hàng / Hoàn tiền / Hủy',
          value: stats.cancelled_orders ?? 0,
          to: '/admin/don-hang',
        },
      ]
    : []

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-welcome">
        <h1>Chào mừng bạn đến với Trang Quản trị Viên!</h1>
        <p>
          Xin chào, <strong>{user?.name}</strong> — quản lý cửa hàng Lytus Casio.
        </p>
      </header>

      {orderCards.length > 0 && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Đơn hàng</h2>
          </div>
          <div className="admin-order-summary">
            {orderCards.map((card) => (
              <Link key={card.label} to={card.to} className="admin-order-summary-card">
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="admin-panel admin-panel--sales">
        <div className="admin-panel-head">
          <h2>Phân tích bán hàng</h2>
          <Link to="/admin/phan-tich" className="admin-panel-more">
            Xem thêm ›
          </Link>
        </div>
        {stats ? (
          <div className="admin-sales-hero">
            <p className="admin-sales-hero-label">Doanh số hôm nay</p>
            <p className="admin-sales-hero-value">
              {formatPrice(stats.today_revenue)}
            </p>
            <p className="admin-sales-hero-sub">
              {stats.today_orders} đơn hàng hôm nay
            </p>
          </div>
        ) : (
          <p className="admin-dashboard-loading">Đang tải thống kê...</p>
        )}
      </section>
    </div>
  )
}
