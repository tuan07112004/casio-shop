import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProduct } from '../../api/client'
import { useCart } from '../../context/CartContext'
import LogoMarquee from '../../components/LogoMarquee/LogoMarquee'
import ProductDetailGallery from '../../components/ProductDetailGallery/ProductDetailGallery'
import SimilarProducts from '../../components/SimilarProducts/SimilarProducts'
import {
  getColorPreviewImages,
  getColorSwatches,
  getConditionPrice,
  getDiscountPercent,
  getOriginalPrice,
  getProductConditions,
  getProductDescription,
} from '../../utils/productCard'
import { getProductGallery } from '../../utils/productGallery'
import { formatPrice } from '../../utils/format'
import './ProductDetailPage.css'

const CATEGORY_LABEL = {
  'may-tinh': 'Máy tính',
  balo: 'Balo',
  'phu-kien': 'Phụ kiện',
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
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedCondition, setSelectedCondition] = useState(0)
  const [colorPreviewSrc, setColorPreviewSrc] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    setProduct(null)
    setQty(1)
    setAdded(false)
    setSelectedColor(0)
    setSelectedCondition(0)
    setColorPreviewSrc(null)

    fetchProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleAdd = (goToCart = false) => {
    if (!product) return
    const productConditions = getProductConditions(product)
    const conditionId = productConditions?.[selectedCondition]?.id
    const price = productConditions
      ? getConditionPrice(product, conditionId)
      : product.price
    addToCart({ ...product, price }, qty)
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

  const catLabel = CATEGORY_LABEL[product.category] || 'Sản phẩm'
  const conditions = getProductConditions(product)
  const selectedConditionId = conditions?.[selectedCondition]?.id
  const salePrice = conditions
    ? getConditionPrice(product, selectedConditionId)
    : product.price
  const originalPrice = getOriginalPrice(salePrice)
  const discount = getDiscountPercent(salePrice, originalPrice)
  const colorSwatches = getColorSwatches(product)
  const colorPreviewImages = getColorPreviewImages(product)
  const galleryItems = getProductGallery(product)

  return (
    <div className="product-detail-page">
      <div className="product-detail">
      <article className="product-detail-layout">
        <ProductDetailGallery
          items={galleryItems}
          productName={product.name}
          stageOverride={colorPreviewSrc}
        />

        <div className="product-detail-info">
          <nav className="product-detail-breadcrumb" aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link to="/cua-hang">Sản phẩm</Link>
            <span aria-hidden="true">/</span>
            <span className="product-detail-breadcrumb-current">{catLabel}</span>
          </nav>

          <h1 className="product-detail-name">{product.name}</h1>

          {conditions && (
            <div className="product-detail-condition">
              <span className="product-detail-field-label">Độ mới</span>
              <div className="product-detail-condition-row">
                {conditions.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`product-detail-condition-btn${selectedCondition === i ? ' product-detail-condition-btn--active' : ''}`}
                    aria-pressed={selectedCondition === i}
                    onClick={() => setSelectedCondition(i)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-prices">
            <span className="product-detail-price-sale">{formatPrice(salePrice)}</span>
            {discount > 0 && (
              <span className="product-detail-price-original">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          <div className="product-detail-desc-block">
            <h2 className="product-detail-desc-heading">Mô tả</h2>
            <p className="product-detail-desc">{getProductDescription(product)}</p>
          </div>

          {colorSwatches && (
            <div
              className="product-detail-colors"
              onMouseLeave={() => setColorPreviewSrc(null)}
            >
              <span className="product-detail-field-label">Màu sắc</span>
              <div className="product-detail-swatch-row">
                {colorSwatches.map((swatch, i) => (
                  <button
                    key={swatch.label}
                    type="button"
                    className={`product-detail-swatch${selectedColor === i ? ' product-detail-swatch--active' : ''}`}
                    title={swatch.label}
                    aria-label={swatch.label}
                    aria-pressed={selectedColor === i}
                    onClick={() => setSelectedColor(i)}
                    onMouseEnter={() => {
                      setSelectedColor(i)
                      if (colorPreviewImages?.[i]) {
                        setColorPreviewSrc(colorPreviewImages[i])
                      }
                    }}
                  >
                    <span
                      className="product-detail-swatch-inner"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-qty-block">
            <span className="product-detail-field-label">Chọn số lượng</span>
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
              className="product-detail-btn product-detail-btn--cart"
              onClick={() => handleAdd(false)}
            >
              Thêm vào giỏ hàng
            </button>
            <button
              type="button"
              className="product-detail-btn product-detail-btn--buy"
              onClick={() => handleAdd(true)}
            >
              Mua ngay
            </button>
          </div>

          {added && (
            <p className="product-detail-added" role="status">
              ✓ Đã thêm vào giỏ · <Link to="/gio-hang">Xem giỏ hàng</Link>
            </p>
          )}
        </div>
      </article>
      </div>

      <div className="product-detail-below">
        <LogoMarquee />
        <SimilarProducts product={product} />
      </div>
    </div>
  )
}
