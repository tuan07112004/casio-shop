import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  apiFetchOrders,
  apiFetchOrderStats,
  apiUpdateOrderStatus,
  apiUpdatePaymentStatus,
} from '../../api/orders'
import { formatPrice } from '../../utils/format'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  formatOrderDate,
} from '../../utils/orderLabels'
import './AdminOrdersPage.css'

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'cancelled', label: 'Đã hủy' },
]

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([apiFetchOrders(token), apiFetchOrderStats(token)])
      .then(([orderList, orderStats]) => {
        setOrders(orderList)
        setStats(orderStats)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length }
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1
    }
    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

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
          <h1>Tất cả đơn hàng</h1>
          <p className="admin-orders-desc">Theo dõi và xử lý đơn hàng Lytus Casio</p>
        </div>
      </header>

      {stats && (
        <div className="admin-orders-stats">
          <div className="admin-orders-stat">
            <span className="admin-orders-stat-value">{stats.today_orders}</span>
            <span className="admin-orders-stat-label">Hôm nay</span>
          </div>
          <div className="admin-orders-stat">
            <span className="admin-orders-stat-value">{stats.to_ship_orders ?? 0}</span>
            <span className="admin-orders-stat-label">Chờ lấy hàng</span>
          </div>
          <div className="admin-orders-stat">
            <span className="admin-orders-stat-value">{stats.processed_orders ?? 0}</span>
            <span className="admin-orders-stat-label">Đã xử lý</span>
          </div>
          <div className="admin-orders-stat">
            <span className="admin-orders-stat-value">{stats.total_orders}</span>
            <span className="admin-orders-stat-label">Tổng đơn</span>
          </div>
        </div>
      )}

      <div className="admin-orders-filters">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-orders-filter-btn${
              statusFilter === tab.key ? ' admin-orders-filter-btn--active' : ''
            }`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <span className="admin-orders-filter-count">
              {statusCounts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="admin-orders-empty">
          {orders.length === 0
            ? 'Chưa có đơn nào.'
            : 'Không có đơn ở trạng thái này.'}
        </div>
      ) : (
        <div className="admin-orders-list">
          {filteredOrders.map((order) => (
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
                {order.guestEmail && (
                  <span className="admin-order-email">{order.guestEmail}</span>
                )}
              </div>

              <p className="admin-order-address">{order.guestAddress}</p>

              <ul className="admin-order-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
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
                        <option key={k} value={k}>
                          {v}
                        </option>
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
