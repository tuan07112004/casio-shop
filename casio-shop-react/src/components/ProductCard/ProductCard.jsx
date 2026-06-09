import { Link } from 'react-router-dom'
import ProductCardVisual from '../ProductCardVisual/ProductCardVisual'
import { formatPrice } from '../../utils/format'
import {
  getColorSwatches,
  getDiscountPercent,
  getOriginalPrice,
} from '../../utils/productCard'

export default function ProductCard({ product }) {
  const cat = product.category || 'phu-kien'
  const originalPrice = getOriginalPrice(product.price)
  const discountPercent = getDiscountPercent(product.price, originalPrice)
  const colorSwatches = getColorSwatches(product)

  return (
    <li className="product-showcase-card">
      <Link to={`/san-pham/${product.id}`} className="product-showcase-link">
        <ProductCardVisual product={product} category={cat}>
          {discountPercent > 0 && (
            <span className="product-showcase-discount">
              Giảm {discountPercent}%
            </span>
          )}
        </ProductCardVisual>
        <div className="product-showcase-body">
          <h3 className="product-showcase-name">{product.name}</h3>
          <div className="product-showcase-prices">
            <span className="product-showcase-price-sale">
              {formatPrice(product.price)}
            </span>
            <span className="product-showcase-price-original">
              {formatPrice(originalPrice)}
            </span>
          </div>
          {colorSwatches && (
            <div className="product-showcase-colors" aria-label="Màu sắc">
              {colorSwatches.map((swatch) => (
                <span
                  key={swatch.label}
                  className="product-showcase-swatch"
                  title={swatch.label}
                >
                  <span
                    className="product-showcase-swatch-inner"
                    style={{ backgroundColor: swatch.hex }}
                    aria-hidden
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}
