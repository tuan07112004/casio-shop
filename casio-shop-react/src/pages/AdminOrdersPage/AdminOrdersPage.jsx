import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  apiFetchOrders,
  apiFetchOrderStats,
  apiUpdateOrderStatus,
  apiUpdatePaymentStatus,
} from '../../api/orders'
import AdminStats from '../../components/AdminStats/AdminStats'
import { formatPrice } from '../../utils/format'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  formatOrderDate,
} from '../../utils/orderLabels'
import './AdminOrdersPage.css'

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([apiFetchOrders(token), apiFetchOrderStats(token)])
      .then(([orderList, orderStats]) => {
        setOrders(orderList)
        setStats(orderStats)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleStatus = async (orderId, status) => {
    try {
      const updated = await apiUpdateOrderStatus(token, orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      const freshStats = await apiFetchOrderStats(token)
      setStats(freshStats)
    } catch (e) {
      alert(e.message)
    }
  }

  const handlePaymentStatus = async (orderId, paymentStatus) => {
    try {
      const updated = await apiUpdatePaymentStatus(token, orderId, paymentStatus)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) {
    return (
      <div className="admin-orders">
        <p className="admin-orders-loading">Đang tải...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-orders">
        <p className="admin-orders--error">{error}</p>
      </div>
    )
  }

  return (
    <div className="admin-orders">
      <header className="admin-orders-header">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p className="admin-orders-desc">Theo dõi doanh thu và xử lý đơn Lytus Casio</p>
        </div>
        <Link to="/admin" className="admin-orders-back">
          ← Về admin
        </Link>
      </header>

      <AdminStats stats={stats} />

      {orders.length === 0 ? (
        <div className="admin-orders-empty">Chưa có đơn nào.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="admin-order-card">
              <div className="admin-order-head">
                <div className="admin-order-id-block">
                  <strong>#{order.id}</strong>
                  <time>{formatOrderDate(order.createdAt)}</time>
                </div>
                <span className={`admin-order-badge admin-order-badge--${order.status}`}>
                  {ORDER_STATUS_LABEL[order.status] || order.status}
                </span>
              </div>

              <div className="admin-order-customer">
                <span className="admin-order-name">{order.guestName}</span>
                <a href={`tel:${order.guestPhone}`} className="admin-order-phone">
                  {order.guestPhone}
                </a>
                <span className="admin-order-email">{order.guestEmail}</span>
              </div>

              <p className="admin-order-address">{order.guestAddress}</p>

              <ul className="admin-order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.productName} × {item.quantity}</span>
                    <span>{formatPrice(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <footer className="admin-order-foot">
                <div className="admin-order-meta-row">
                  <span className="admin-order-payment">
                    {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                  </span>
                  <span
                    className={`admin-order-pay-badge admin-order-pay-badge--${order.paymentStatus}`}
                  >
                    {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                  </span>
                  <strong className="admin-order-total">
                    {formatPrice(order.totalAmount)}
                  </strong>
                </div>
                <div className="admin-order-actions">
                  {order.paymentMethod === 'bank_transfer' &&
                    order.paymentStatus === 'unpaid' && (
                      <button
                        type="button"
                        className="admin-order-confirm-pay"
                        onClick={() => handlePaymentStatus(order.id, 'paid')}
                      >
                        Xác nhận đã nhận CK
                      </button>
                    )}
                  <label className="admin-order-status-select">
                    Trạng thái
                    <select
                      value={order.status}
                      onChange={(e) => handleStatus(order.id, e.target.value)}
                    >
                      {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
