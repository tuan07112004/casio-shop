import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { apiCreateOrder } from '../../api/orders'
import { formatPrice, isValidEmail, EMAIL_ERROR_MSG } from '../../utils/format'
import './CheckoutPage.css'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, token, isLoggedIn } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [form, setForm] = useState({
    guest_name: user?.name || '',
    guest_phone: '',
    guest_email: user?.email || '',
    guest_address: '',
    payment_method: 'cod',
    note: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Thanh toán</h1>
        <p>Giỏ hàng trống.</p>
        <Link to="/cua-hang">Mua sắm ngay</Link>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.guest_name.trim()) return setError('Vui lòng nhập họ tên.')
    if (!/^0\d{8,10}$/.test(form.guest_phone.trim()))
      return setError('Số điện thoại phải bắt đầu bằng 0 và có 9–11 số.')
    if (!isValidEmail(form.guest_email)) return setError(EMAIL_ERROR_MSG)
    if (!form.guest_address.trim()) return setError('Vui lòng nhập địa chỉ giao hàng.')

    setLoading(true)
    try {
      const order = await apiCreateOrder(
        {
          ...form,
          guest_phone: form.guest_phone.trim(),
          guest_email: form.guest_email.trim(),
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        },
        isLoggedIn ? token : null,
      )

      clearCart()
      const payment = form.payment_method
      const qs = new URLSearchParams({
        ma: String(order.id),
        payment,
        amount: String(order.totalAmount),
      })
      navigate(`/dat-hang-thanh-cong?${qs.toString()}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Không đặt được hàng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Thanh toán</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <h2>Thông tin giao hàng</h2>
          {!isLoggedIn && (
            <p className="checkout-hint">
              Không cần đăng ký — điền form là đặt được hàng.
            </p>
          )}

          <label>
            Họ và tên
            <input
              name="guest_name"
              value={form.guest_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Số điện thoại
            <input
              name="guest_phone"
              value={form.guest_phone}
              onChange={handleChange}
              placeholder="0901234567"
              required
            />
          </label>

          <label>
            Email
            <input
              name="guest_email"
              type="email"
              value={form.guest_email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Địa chỉ giao hàng
            <textarea
              name="guest_address"
              value={form.guest_address}
              onChange={handleChange}
              rows={3}
              required
            />
          </label>

          <label>
            Phương thức thanh toán
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
            >
              <option value="cod">COD — thanh toán khi nhận hàng</option>
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
            </select>
          </label>

          <label>
            Ghi chú (tùy chọn)
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
            />
          </label>

          {error && <p className="checkout-error">{error}</p>}

          <button type="submit" className="checkout-submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Đơn hàng ({items.length} sản phẩm)</h2>
          <ul>
            {items.map((item) => (
              <li key={item.productId}>
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="checkout-total">
            Tổng: <strong>{formatPrice(totalPrice)}</strong>
          </p>
        </aside>
      </div>
    </div>
  )
}