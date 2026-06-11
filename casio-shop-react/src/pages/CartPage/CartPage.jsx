import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { productDetailPath } from '../../utils/cartLine'
import { formatPrice, productImageSrc } from '../../utils/format'
import './CartPage.css'

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    totalPrice,
    totalItems,
    cartError,
    clearCartError,
  } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <nav className="cart-breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <span aria-hidden="true">|</span>
          <span>Giỏ hàng</span>
        </nav>
        <h1 className="cart-title">Giỏ hàng của bạn</h1>
        <div className="cart-empty">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/cua-hang" className="cart-cta cart-cta--primary">
            Mua thêm sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <nav className="cart-breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true">|</span>
        <span>Giỏ hàng</span>
      </nav>

      <h1 className="cart-title">
        Giỏ hàng của bạn
        <span className="cart-title-count">
          (Có {totalItems} sản phẩm trong giỏ hàng)
        </span>
      </h1>

      <div className="cart-layout">
        <section className="cart-main" aria-label="Sản phẩm trong giỏ">
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.lineKey} className="cart-item">
                <Link
                  to={productDetailPath(item.slug)}
                  className="cart-item-thumb"
                >
                  <img
                    src={productImageSrc(item.image)}
                    alt={item.name}
                    loading="lazy"
                  />
                </Link>

                <div className="cart-item-info">
                  <Link
                    to={productDetailPath(item.slug)}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>
                  {item.variantLabel && (
                    <p className="cart-item-variant">{item.variantLabel}</p>
                  )}
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.lineKey)}
                  >
                    Xóa
                  </button>
                </div>

                <div className="cart-item-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => {
                      clearCartError()
                      updateQuantity(item.lineKey, item.quantity - 1)
                    }}
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => {
                      clearCartError()
                      updateQuantity(item.lineKey, item.quantity + 1)
                    }}
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                <p className="cart-item-price">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="cart-summary">
          <h2>Tóm tắt đơn hàng</h2>
          <p className="cart-summary-note">Chưa bao gồm phí vận chuyển</p>
          <p className="cart-summary-total">
            Tổng tiền: <strong>{formatPrice(totalPrice)}</strong>
          </p>
          <p className="cart-summary-hint">
            Bạn có thể nhập mã giảm giá ở trang thanh toán
          </p>

          {cartError && (
            <p className="cart-error" role="alert">
              {cartError}
            </p>
          )}

          <Link to="/thanh-toan" className="cart-cta cart-cta--primary">
            Tiến hành đặt hàng
          </Link>
          <Link to="/cua-hang" className="cart-cta cart-cta--secondary">
            Mua thêm sản phẩm
          </Link>

          <ul className="cart-trust">
            <li>
              <img
                src="/images/icon/delivery-truck.png"
                alt=""
                className="cart-trust-icon"
                width={18}
                height={18}
                aria-hidden
              />
              Giao hàng nội thành trong 24 giờ
            </li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
