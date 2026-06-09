import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { apiLookupOrdersByPhone } from '../../api/orders'
import {
  BANK_TRANSFER_INFO,
  bankTransferNote,
  buildVietQrUrl,
} from '../../config/payment'
import { formatPrice } from '../../utils/format'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  formatOrderDate,
} from '../../utils/orderLabels'
import './OrderLookupPage.css'

function OrderLookupCard({ order }) {
  const showQr =
    order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'unpaid'
  const qrUrl = showQr ? buildVietQrUrl(order.id, order.totalAmount) : null

  return (
    <article className="order-lookup-result">
      <header className="order-lookup-result-head">
        <div>
          <h2>Đơn hàng #{order.id}</h2>
          <time>{formatOrderDate(order.createdAt)}</time>
        </div>
        <div className="order-lookup-badges">
          <span className={`order-lookup-badge order-lookup-badge--${order.status}`}>
            {ORDER_STATUS_LABEL[order.status] || order.status}
          </span>
          <span
            className={`order-lookup-pay-badge order-lookup-pay-badge--${order.paymentStatus}`}
          >
            {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
          </span>
        </div>
      </header>

      <p className="order-lookup-customer">
        {order.guestName} · {order.guestPhone}
      </p>
      <p className="order-lookup-address">Giao đến: {order.guestAddress}</p>
      <p className="order-lookup-payment">
        Thanh toán:{' '}
        {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
      </p>

      <ul className="order-lookup-items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <p className="order-lookup-total">
        Tổng cộng: <strong>{formatPrice(order.totalAmount)}</strong>
      </p>

      {showQr && qrUrl && (
        <div className="order-lookup-bank">
          <h3>Chuyển khoản để xác nhận đơn</h3>
          <div className="order-lookup-qr">
            <img src={qrUrl} alt="Mã QR chuyển khoản" width={220} height={220} />
          </div>
          <dl className="order-lookup-bank-details">
            <div>
              <dt>Ngân hàng</dt>
              <dd>{BANK_TRANSFER_INFO.bank}</dd>
            </div>
            <div>
              <dt>Số tài khoản</dt>
              <dd>{BANK_TRANSFER_INFO.accountNumber}</dd>
            </div>
            <div>
              <dt>Nội dung CK</dt>
              <dd>{bankTransferNote(order.id)}</dd>
            </div>
          </dl>
        </div>
      )}

      {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'paid' && (
        <p className="order-lookup-paid-note">
          Đã xác nhận thanh toán. Đơn hàng đang được xử lý.
        </p>
      )}
    </article>
  )
}

export default function OrderLookupPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const inAccount = pathname.startsWith('/tai-khoan')

  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const p = searchParams.get('phone')
    if (p) setPhone(p)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setOrders([])

    const trimmedPhone = phone.trim()

    if (!/^0\d{8,10}$/.test(trimmedPhone)) {
      return setError('Số điện thoại phải bắt đầu bằng 0 và có 9–11 số.')
    }

    setLoading(true)
    try {
      const result = await apiLookupOrdersByPhone(trimmedPhone)
      setOrders(result)
    } catch (err) {
      setError(err.message || 'Không tra cứu được đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`order-lookup${inAccount ? ' order-lookup--account' : ' order-lookup--standalone'}`}
    >
      <div className="order-lookup-hero">
        {inAccount && (
          <nav className="account-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span aria-hidden>/</span>
            <Link to="/tai-khoan">Tài khoản</Link>
            <span aria-hidden>/</span>
            <span>Tra cứu đơn</span>
          </nav>
        )}

        <h1 className="order-lookup-title">Tra cứu đơn hàng</h1>
        <p className="order-lookup-lead">
          Nhập <strong>số điện thoại</strong> bạn đã dùng khi đặt hàng.
        </p>

        <form className="order-lookup-form" onSubmit={handleSubmit} noValidate>
          <label className="order-lookup-label" htmlFor="order-lookup-phone">
            Số điện thoại
          </label>
          <input
            id="order-lookup-phone"
            className="order-lookup-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            inputMode="numeric"
            autoComplete="tel"
            required
          />
          {error && <p className="order-lookup-error">{error}</p>}
          <button
            type="submit"
            className="order-lookup-submit"
            disabled={loading}
          >
            {loading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </form>

        {!inAccount && (
          <p className="order-lookup-help">
            Cần hỗ trợ? <Link to="/faq">Xem FAQ</Link> hoặc{' '}
            <a href="tel:0988480655">gọi hotline</a>.
          </p>
        )}
      </div>

      {orders.length > 0 && (
        <div className="order-lookup-results">
          <p className="order-lookup-count">
            Tìm thấy <strong>{orders.length}</strong> đơn hàng
          </p>
          {orders.map((order) => (
            <OrderLookupCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
