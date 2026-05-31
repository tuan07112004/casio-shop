import { Link } from 'react-router-dom'
import StockBadge from '../StockBadge/StockBadge'
import { formatPrice } from '../../utils/format'
import Button from '../Button/Button'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const discount =
    product.originalPrice && product.originalPrice > product.price

  return (
    <li className="product-card">
      <Link to={`/san-pham/${product.id}`} className="product-card-image-wrap">
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <h3>
          <Link to={`/san-pham/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-card-prices">
          <span className="price">{formatPrice(product.price)}</span>
          {discount && (
            <span className="old-price">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        <StockBadge stock={product.stock} className="stock-badge--card" />
        <Button content="Xem chi tiết" to={`/san-pham/${product.id}`} />
      </div>
    </li>
  )
}
