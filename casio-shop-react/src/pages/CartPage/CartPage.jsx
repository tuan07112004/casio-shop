import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/format'
import Button from '../../components/Button/Button'
import './CartPage.css'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Giỏ hàng</h1>
        <p className="cart-empty">Giỏ trống — hãy chọn sản phẩm nhé.</p>
        <Button content="Mua sắm ngay" to="/cua-hang" />
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1>Giỏ hàng</h1>

      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.productId} className="cart-item">
            <img src={item.image} alt={item.name} width={96} height={96} />
            <div className="cart-item-info">
              <h3>
                <Link to={`/san-pham/${item.productId}`}>{item.name}</Link>
              </h3>
              <p className="cart-item-price">{formatPrice(item.price)}</p>
              <div className="cart-qty">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>
            <p className="cart-item-subtotal">
              {formatPrice(item.price * item.quantity)}
            </p>
            <button
              type="button"
              className="cart-remove"
              onClick={() => removeFromCart(item.productId)}
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <p className="cart-total">
          Tổng cộng: <strong>{formatPrice(totalPrice)}</strong>
        </p>
        <p className="cart-note">
          Thanh toán trực tuyến sẽ được bổ sung ở bước đặt hàng qua API.
        </p>
        <Button content="Tiếp tục mua sắm" to="/cua-hang" />
      </div>
    </div>
  )
}
