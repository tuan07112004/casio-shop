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
import './MyOrdersPage.css'

export default function MyOrdersPage() {
  const { token, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetchMyOrders(token)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="my-orders">
        <p className="my-orders-loading">Đang tải đơn hàng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-orders">
        <p className="my-orders-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="my-orders">
      <header className="my-orders-header">
        <h1 className="my-orders-title">Đơn hàng của tôi</h1>
        <p className="my-orders-sub">
          Xin chào <strong>{user?.name}</strong> — các đơn bạn đặt khi đã đăng nhập.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="my-orders-empty">
          <p>Bạn chưa có đơn hàng nào.</p>
          <p className="my-orders-empty-hint">
            Đặt hàng khi đã đăng nhập để lưu lịch sử tại đây.
          </p>
          <Link to="/cua-hang" className="my-orders-cta">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="my-order-card">
              <div className="my-order-top">
                <div>
                  <strong className="my-order-id">Đơn #{order.id}</strong>
                  <time className="my-order-date">{formatOrderDate(order.createdAt)}</time>
                </div>
                <span className={`my-order-badge my-order-badge--${order.status}`}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
              </div>

              <ul className="my-order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity}
                    <span>{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <footer className="my-order-footer">
                <span>
                  {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                </span>
                <strong>{formatPrice(order.totalAmount)}</strong>
              </footer>

              <p className="my-order-address">
                Giao đến: {order.guestAddress}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
