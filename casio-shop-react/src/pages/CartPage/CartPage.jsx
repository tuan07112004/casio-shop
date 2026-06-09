import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatPrice, productImageSrc } from '../../utils/format'
import './CartPage.css'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } =
    useCart()

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Giỏ hàng</h1>
        <div className="cart-empty">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/cua-hang" className="cart-cta">
            Mua sắm ngay
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1 className="cart-title">Giỏ hàng</h1>
        <button type="button" className="cart-clear" onClick={clearCart}>
          Xóa tất cả
        </button>
      </header>

      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.productId} className="cart-item">
            
            <Link
              to={`/san-pham/${item.productId}`}
              className="cart-item-thumb"
            >
              <img src={productImageSrc(item.image)} alt={item.name} />
            </Link>

            <div className="cart-item-body">
              <Link
                to={`/san-pham/${item.productId}`}
                className="cart-item-name"
              >
                {item.name}
              </Link>
              <p className="cart-item-price">{formatPrice(item.price)}</p>

              <div className="cart-item-qty">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  aria-label="Giảm"
                >
                  −
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  aria-label="Tăng"
                >
                  +
                </button>
              </div>
            </div>

            <div className="cart-item-side">
              <p className="cart-item-line-total">
                {formatPrice(item.price * item.quantity)}
              </p>
              <button
                type="button"
                className="cart-item-remove"
                onClick={() => removeFromCart(item.productId)}
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>

      <footer className="cart-footer">
        <p className="cart-total-label">Tổng cộng</p>
        <p className="cart-total-value">{formatPrice(totalPrice)}</p>
        <Link to="/thanh-toan" className="cart-cta">
  Thanh toán
</Link>
<Link to="/cua-hang" className="cart-cta cart-cta--secondary">
  Tiếp tục mua
</Link>
      </footer>
    </div>
  )
}