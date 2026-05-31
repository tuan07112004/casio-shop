import { Link } from 'react-router-dom'
import StockBadge from '../StockBadge/StockBadge'
import { formatPrice, getDiscountPercent } from '../../utils/format'
import './HomeProductCard.css'

export default function HomeProductCard({ product, label, variant = 'dark' }) {
  const discount = getDiscountPercent(product.price, product.originalPrice)
  const displayName = label ?? product.name

  return (
    <li className="home-product-card">
      <Link
        to={`/san-pham/${product.id}`}
        className={`home-product-card-link home-product-card-link--${variant}`}
      >
        <div className={`home-product-visual home-product-visual--${variant}`}>
          <StockBadge stock={product.stock} className="stock-badge--overlay" />
          <img src={product.image} alt={product.name} />
        </div>

        <div className="home-product-promo">Giá dành riêng bạn mới</div>

        <div className="home-product-pricing">
          <p className="home-product-price">{formatPrice(product.price)}</p>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="home-product-meta">
              <span className="home-product-old">
                {formatPrice(product.originalPrice)}
              </span>
              {discount != null && (
                <span className="home-product-off">-{discount}%</span>
              )}
            </div>
          )}
        </div>

        <div className="home-product-label">{displayName}</div>
      </Link>
    </li>
  )
}
