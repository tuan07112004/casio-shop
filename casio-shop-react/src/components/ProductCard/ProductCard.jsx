import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ProductCardVisual from '../ProductCardVisual/ProductCardVisual'
import { useQuickView } from '../../context/QuickViewContext'
import { productDetailPath } from '../../utils/cartLine'
import { formatPrice } from '../../utils/format'
import {
  formatProductListPrice,
  getColorSwatches,
  getProductDiscountPercent,
  getProductListPrice,
  getProductListSalePrice,
} from '../../utils/productCard'

const ICON_EYE = '/images/icon/eye.png'

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 7h14l-1.2 10H7.2L6 7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V5a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function ProductCard({ product }) {
  const { isAdmin } = useAuth()
  const { openQuickView } = useQuickView()
  const cat = product.category || 'phu-kien'
  const listPrice = getProductListPrice(product)
  const salePrice = getProductListSalePrice(product)
  const originalPrice = salePrice < listPrice ? listPrice : 0
  const discountPercent = getProductDiscountPercent(product)
  const colorSwatches = getColorSwatches(product)
  const detailPath = productDetailPath(product)

  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openQuickView(product)
  }

  return (
    <li className="product-showcase-card">
      <Link to={detailPath} className="product-showcase-link">
        <ProductCardVisual product={product} category={cat}>
          {discountPercent > 0 && (
            <span className="product-showcase-discount">
              Giảm {discountPercent}%
            </span>
          )}
        </ProductCardVisual>
      </Link>

      <Link to={detailPath} className="product-showcase-info-link">
        <div className="product-showcase-body">
          <h3 className="product-showcase-name">{product.name}</h3>
          <div className="product-showcase-prices">
            <span className="product-showcase-price-sale">
              {formatProductListPrice(product, formatPrice)}
            </span>
            {originalPrice > salePrice && (
              <span className="product-showcase-price-original">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {colorSwatches?.length > 0 && (
        <div className="product-showcase-colors" aria-label="Màu sắc">
          {colorSwatches.map((swatch, i) => (
            <Link
              key={`${swatch.label}-${i}`}
              to={`${detailPath}?mau=${i}`}
              className="product-showcase-swatch"
              title={swatch.label}
              aria-label={`${product.name} — ${swatch.label}`}
            >
              <span
                className="product-showcase-swatch-inner"
                style={{ backgroundColor: swatch.hex }}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      )}

      <div
        className={`product-showcase-hover-bar${isAdmin ? ' product-showcase-hover-bar--view-only' : ''}`}
      >
        {!isAdmin && (
          <button
            type="button"
            className="product-showcase-add-btn"
            onClick={handleQuickView}
          >
            <span className="product-showcase-add-btn-fill" aria-hidden />
            <span className="product-showcase-add-btn-content">
              <BagIcon />
              <span className="product-showcase-add-btn-label">Thêm vào giỏ</span>
            </span>
          </button>
        )}
        <Link
          to={detailPath}
          className="product-showcase-detail-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={ICON_EYE} alt="" />
          <span>Xem chi tiết</span>
        </Link>
      </div>
    </li>
  )
}
