import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProduct } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { formatPrice, productImageSrc } from '../../utils/format'
import './ProductDetailPage.css'

const CATEGORY_LABEL = {
  'may-tinh': 'Máy tính',
  balo: 'Balo',
  'phu-kien': 'Phụ kiện',
}

function getOriginalPrice(price) {
  return Math.ceil((price * 1.15) / 1000) * 1000
}

function getDiscountPercent(price, original) {
  if (!original || original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setProduct(null)
    setQty(1)
    setAdded(false)

    fetchProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = (goToCart = false) => {
    if (!product) return
    addToCart(product, qty)
    if (goToCart) {
      navigate('/gio-hang')
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  if (loading) {
    return (
      <div className="product-detail">
        <p className="product-detail-status">Đang tải...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <p className="product-detail-status product-detail-status--error">
          {error || 'Không tìm thấy sản phẩm'}
        </p>
        <Link to="/cua-hang" className="product-detail-back">
          ← Quay lại cửa hàng
        </Link>
      </div>
    )
  }

  const catClass = product.category?.replace(/[^a-z0-9-]/g, '') || 'phu-kien'
  const catLabel = CATEGORY_LABEL[product.category] || 'Sản phẩm'
  const originalPrice = getOriginalPrice(product.price)
  const discount = getDiscountPercent(product.price, originalPrice)
  const savings = originalPrice - product.price

  return (
    <div className="product-detail">
      <nav className="product-detail-breadcrumb" aria-label="Đường dẫn">
        <Link to="/cua-hang">Cửa hàng</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/cua-hang?category=${product.category}`}>{catLabel}</Link>
        <span aria-hidden="true">/</span>
        <span className="product-detail-breadcrumb-current">{product.name}</span>
      </nav>

      <article className="product-detail-layout">
        <div className={`product-detail-visual product-detail-visual--${catClass}`}>
          <img
            src={productImageSrc(product.image)}
            alt={product.name}
            className="product-detail-img"
          />
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-prices">
            <span className="product-detail-price-sale">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="product-detail-price-original">
                  {formatPrice(originalPrice)}
                </span>
                <span className="product-detail-discount">-{discount}%</span>
              </>
            )}
          </div>

          {savings > 0 && (
            <p className="product-detail-savings">
              (Tiết kiệm {formatPrice(savings)})
            </p>
          )}

          <div className="product-detail-qty-block">
            <span className="product-detail-qty-label">Số lượng</span>
            <div className="product-detail-qty-controls">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Giảm"
              >
                −
              </button>
              <span className="qty-value">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((n) => n + 1)}
                aria-label="Tăng"
              >
                +
              </button>
            </div>
          </div>

          <div className="product-detail-btns">
            <button
              type="button"
              className="product-detail-btn product-detail-btn--buy"
              onClick={() => handleAdd(true)}
            >
              Mua ngay
            </button>
            <button
              type="button"
              className="product-detail-btn product-detail-btn--cart"
              onClick={() => handleAdd(false)}
            >
              Thêm vào giỏ
            </button>
          </div>

          {added && (
            <p className="product-detail-added" role="status">
              ✓ Đã thêm vào giỏ · <Link to="/gio-hang">Xem giỏ hàng</Link>
            </p>
          )}

          <ul className="product-detail-trust">
            <li>🚚 Giao hàng toàn quốc</li>
            <li>✓ Cam kết chính hãng</li>
            <li>☎ Hỗ trợ 0988 480 655</li>
          </ul>
        </div>
      </article>
    </div>
  )
}

