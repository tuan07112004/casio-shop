import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { productDetailPath } from '../../utils/cartLine'
import { formatPrice, productImageSrc } from '../../utils/format'
import './MiniCartDrawer.css'

export default function MiniCartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    isMiniCartOpen,
    closeMiniCart,
  } = useCart()

  useEffect(() => {
    if (!isMiniCartOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMiniCartOpen])

  if (!isMiniCartOpen) return null

  return (
    <div className="mini-cart-root" role="presentation">
      <button
        type="button"
        className="mini-cart-backdrop"
        aria-label="Đóng giỏ hàng"
        onClick={closeMiniCart}
      />
      <aside className="mini-cart-panel" aria-label="Giỏ hàng">
        <header className="mini-cart-header">
          <div>
            <h2>Giỏ hàng</h2>
            <p>
              Bạn đang có {totalItems} sản phẩm trong giỏ hàng
            </p>
          </div>
          <button
            type="button"
            className="mini-cart-close"
            onClick={closeMiniCart}
            aria-label="Đóng"
          >
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="mini-cart-empty">
            <p>Giỏ hàng đang trống.</p>
            <Link to="/cua-hang" className="mini-cart-shop-link" onClick={closeMiniCart}>
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <>
            <ul className="mini-cart-list">
              {items.map((item) => (
                <li key={item.lineKey} className="mini-cart-item">
                  <Link
                    to={productDetailPath(item.slug)}
                    className="mini-cart-item-thumb"
                    onClick={closeMiniCart}
                  >
                    <img
                      src={productImageSrc(item.image)}
                      alt=""
                      loading="lazy"
                    />
                  </Link>
                  <div className="mini-cart-item-body">
                    <Link
                      to={productDetailPath(item.slug)}
                      className="mini-cart-item-name"
                      onClick={closeMiniCart}
                    >
                      {item.name}
                    </Link>
                    <p className="mini-cart-item-meta">
                      {item.variantLabel && `${item.variantLabel} · `}
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                    <button
                      type="button"
                      className="mini-cart-item-remove"
                      onClick={() => removeFromCart(item.lineKey)}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="mini-cart-footer">
              <div className="mini-cart-total-row">
                <span>Tổng tiền tạm tính:</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <Link
                to="/thanh-toan"
                className="mini-cart-checkout"
                onClick={closeMiniCart}
              >
                Tiến hành đặt hàng
              </Link>
              <Link
                to="/gio-hang"
                className="mini-cart-full-link"
                onClick={closeMiniCart}
              >
                Xem chi tiết giỏ hàng →
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
