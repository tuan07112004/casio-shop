import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetchMyOrders } from '../../api/orders'
import { formatPrice } from '../../utils/format'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  formatOrderDate,
} from '../../utils/orderLabels'
import './AccountOverviewPage.css'

export default function AccountOverviewPage() {
  const { token, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetchMyOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [token])

  const recentOrders = orders.slice(0, 3)
  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <div className="account-overview">
      <nav className="account-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden>/</span>
        <span>Tổng quan</span>
      </nav>

      <header className="account-overview-head">
        <h1 className="account-overview-title">Tổng quan</h1>
        <p className="account-overview-greet">
          Xin chào <strong>{firstName}</strong> — chào mừng bạn quay lại Lytus Casio.
        </p>
      </header>

      <div className="account-overview-cards">
        <div className="account-stat-card">
          <span className="account-stat-value">{orders.length}</span>
          <span className="account-stat-label">Đơn hàng</span>
        </div>
        <Link to="/cua-hang" className="account-quick-card">
          <span className="account-quick-title">Mua sắm</span>
          <span className="account-quick-desc">Xem máy tính Casio mới</span>
        </Link>
        <Link to="/tai-khoan/tra-cuu" className="account-quick-card">
          <span className="account-quick-title">Tra cứu đơn</span>
          <span className="account-quick-desc">Mã đơn + số điện thoại</span>
        </Link>
      </div>

      <section className="account-recent">
        <div className="account-recent-head">
          <h2>Đơn hàng gần đây</h2>
          {orders.length > 0 && (
            <Link to="/tai-khoan/don-hang" className="account-recent-all">
              Xem tất cả →
            </Link>
          )}
        </div>

        {loading ? (
          <p className="account-recent-loading">Đang tải...</p>
        ) : recentOrders.length === 0 ? (
          <div className="account-recent-empty">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/cua-hang" className="account-recent-cta">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="account-recent-list">
            {recentOrders.map((order) => (
              <article key={order.id} className="account-recent-card">
                <div className="account-recent-card-top">
                  <div>
                    <strong>Đơn #{order.id}</strong>
                    <time>{formatOrderDate(order.createdAt)}</time>
                  </div>
                  <span
                    className={`account-recent-badge account-recent-badge--${order.status}`}
                  >
                    {ORDER_STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <ul className="account-recent-items">
                  {order.items.slice(0, 2).map((item) => (
                    <li key={item.id}>
                      {item.productName} × {item.quantity}
                    </li>
                  ))}
                  {order.items.length > 2 && (
                    <li className="account-recent-more">
                      +{order.items.length - 2} sản phẩm khác
                    </li>
                  )}
                </ul>
                <footer className="account-recent-foot">
                  <span>
                    {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                  </span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
