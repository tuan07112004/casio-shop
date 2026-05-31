import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProductById } from '../../api/client'
import { useCart } from '../../context/CartContext'
import { getProductById } from '../../data/products'
import StockBadge from '../../components/StockBadge/StockBadge'
import { getStockInfo } from '../../utils/stock'
import { formatPrice } from '../../utils/format'
import './ProductDetailPage.css'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(() => getProductById(id))
  const [loading, setLoading] = useState(!product)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchProductById(id)
      .then((data) => {
        if (!cancelled) setProduct(data)
      })
      .catch(() => {
        if (!cancelled) setProduct(getProductById(id))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="product-detail">
        <p className="detail-loading">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="detail-not-found">
        <p>Không tìm thấy sản phẩm.</p>
        <Link to="/cua-hang">← Về cửa hàng</Link>
      </div>
    )
  }

  const stockInfo = getStockInfo(product.stock)
  const inStock = stockInfo?.className !== 'stock-out'

  const handleAddToCart = () => {
    if (!inStock) return
    addToCart(product, 1)
    navigate('/gio-hang')
  }

  return (
    <div className="product-detail">
      <Link to="/cua-hang" className="detail-back">
        ← Quay lại cửa hàng
      </Link>

      <div className="detail-grid">
        <div className="detail-image-wrap">
          <img
            className="detail-image"
            src={product.image}
            alt={product.name}
          />
        </div>

        <div className="detail-info">
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>

          {product.originalPrice && product.originalPrice > product.price && (
            <p className="detail-old-price">
              Giá gốc: {formatPrice(product.originalPrice)}
            </p>
          )}

          <StockBadge stock={product.stock} className="detail-stock-badge" />

          {product.description && (
            <p className="detail-desc">{product.description}</p>
          )}

          <button
            type="button"
            className="detail-add-btn"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}
