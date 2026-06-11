import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchProduct } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import LogoMarquee from '../../components/LogoMarquee/LogoMarquee'
import ProductDetailGallery from '../../components/ProductDetailGallery/ProductDetailGallery'
import ProductShopVouchers from '../../components/ProductShopVouchers/ProductShopVouchers'
import SimilarProducts from '../../components/SimilarProducts/SimilarProducts'
import {
  getColorPreviewImages,
  getColorSwatches,
  getColorVariantOptions,
  getMachineTypeGroup,
  getProductConditions,
  getProductDiscountPercent,
  getProductDescription,
} from '../../utils/productCard'
import { getProductGallery } from '../../utils/productGallery'
import { formatPrice } from '../../utils/format'
import {
  collectOptionIds,
  getStockInfo,
  productDetailPath,
  resolveLineBasePrice,
  resolveLinePrice,
} from '../../utils/cartLine'
import PageMeta from '../../components/PageMeta/PageMeta'
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from '../../utils/seo'
import { getCategoryLabel } from '../../config/categories'
import { useCategories } from '../../context/CategoriesContext'
import './ProductDetailPage.css'

export default function ProductDetailPage() {
  const { categories } = useCategories()
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedCondition, setSelectedCondition] = useState(0)
  const [colorPreviewSrc, setColorPreviewSrc] = useState(null)
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setProduct(null)
    setQty(1)
    setAdded(false)
    setSelectedColor(0)
    setSelectedCondition(0)
    setColorPreviewSrc(null)
    setDescExpanded(false)

    fetchProduct(id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!product) return

    const colorParam = searchParams.get('mau')
    if (colorParam == null) return

    const idx = Number(colorParam)
    const machineTypes = getMachineTypeGroup(product)
    const swatches = machineTypes?.options || getColorSwatches(product)
    if (
      !swatches ||
      !Number.isInteger(idx) ||
      idx < 0 ||
      idx >= swatches.length
    ) {
      return
    }

    setSelectedColor(idx)
    const previews = getColorPreviewImages(product)
    if (previews?.[idx]) {
      setColorPreviewSrc(previews[idx])
    }
  }, [product, searchParams])

  useEffect(() => {
    if (!product?.slug) return
    if (String(id) !== product.slug && /^\d+$/.test(String(id))) {
      navigate(`/san-pham/${product.slug}${location.search}`, { replace: true })
    }
  }, [product, id, location.search, navigate])

  useEffect(() => {
    if (!product) return
    const info = getStockInfo(product, selectedColor, selectedCondition)
    if (info.stock != null && qty > info.stock) {
      setQty(Math.max(1, info.stock))
    }
  }, [product, selectedColor, selectedCondition, qty])

  const handleAdd = (goToCart = false) => {
    if (!product) return
    addToCart(product, qty, { variantIndex: selectedColor, conditionIndex: selectedCondition })
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

  const catLabel = getCategoryLabel(product.category, 'Sản phẩm', categories)
  const conditions = getProductConditions(product)
  const optionIds = collectOptionIds(product, selectedColor, selectedCondition)
  const basePrice = resolveLineBasePrice(product, optionIds)
  const salePrice = resolveLinePrice(product, optionIds)
  const originalPrice = salePrice < basePrice ? basePrice : 0
  const discount = getProductDiscountPercent(product)
  const machineTypes = getMachineTypeGroup(product)
  const colorSwatches = getColorSwatches(product)
  const colorVariantOptions = getColorVariantOptions(product)
  const variantOptions = machineTypes?.options || colorVariantOptions || colorSwatches
  const variantLabel = machineTypes?.label || 'Màu sắc'
  const colorPreviewImages = getColorPreviewImages(product)
  const galleryItems = getProductGallery(product)
  const stockInfo = getStockInfo(product, selectedColor, selectedCondition)

  const selectVariant = (index) => {
    setSelectedColor(index)
    if (colorPreviewImages?.[index]) {
      setColorPreviewSrc(colorPreviewImages[index])
    } else {
      setColorPreviewSrc(null)
    }
  }

  const productPath = productDetailPath(product)
  const productDesc = getProductDescription(product)
  const hasDescription = productDesc.trim().length > 0
  const metaDescription =
    getProductDescription(product).slice(0, 160) ||
    `${product.name} — máy tính Casio chính hãng, giao hàng nhanh.`

  return (
    <div className="product-detail-page">
      <PageMeta
        title={product.name}
        description={metaDescription}
        canonical={absoluteUrl(productPath)}
        ogImage={absoluteUrl(product.image)}
        ogType="product"
        jsonLd={[
          productJsonLd(product, salePrice),
          breadcrumbJsonLd([
            { name: 'Trang chủ', url: '/' },
            { name: 'Sản phẩm', url: '/cua-hang' },
            { name: product.name, url: productPath },
          ]),
        ].filter(Boolean)}
      />
      <div className="product-detail">
      <article className="product-detail-layout">
        <div className="product-detail-media">
          <ProductDetailGallery
            items={galleryItems}
            productName={product.name}
            stageOverride={colorPreviewSrc}
            onThumbSelect={() => setColorPreviewSrc(null)}
          />
        </div>

        <div className="product-detail-info">
          <nav className="product-detail-breadcrumb" aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link to="/cua-hang">Sản phẩm</Link>
            <span aria-hidden="true">/</span>
            <span className="product-detail-breadcrumb-current">{catLabel}</span>
          </nav>

          <h1 className="product-detail-name">{product.name}</h1>

          <ProductShopVouchers productId={product.id} />

          <div className="product-detail-prices">
            <span className="product-detail-price-sale">{formatPrice(salePrice)}</span>
            {discount > 0 && (
              <>
                <span className="product-detail-price-original">
                  {formatPrice(originalPrice)}
                </span>
                <span className="product-detail-price-discount">-{discount}%</span>
              </>
            )}
          </div>

          {variantOptions && (
            <div className="product-detail-variant-section">
              <span className="product-detail-field-label">{variantLabel}</span>
              <div className="product-detail-variant-grid">
                {(machineTypes?.options || colorVariantOptions || colorSwatches).map((opt, i) => {
                  const isActive = selectedColor === i
                  const thumb = colorPreviewImages?.[i]
                  const label = opt.label
                  return (
                    <button
                      key={opt.id || label}
                      type="button"
                      className={`product-detail-variant-card${isActive ? ' product-detail-variant-card--active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => selectVariant(i)}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="product-detail-variant-card-thumb"
                        />
                      ) : (
                        <span
                          className="product-detail-variant-card-thumb product-detail-variant-card-thumb--swatch"
                          style={{
                            backgroundColor: opt.hex || '#e8e8e8',
                          }}
                        />
                      )}
                      <span className="product-detail-variant-card-label">
                        {label}
                      </span>
                      {isActive && (
                        <span className="product-detail-variant-check" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {conditions && (
            <div className="product-detail-variant-section">
              <span className="product-detail-field-label">Độ mới</span>
              <div className="product-detail-variant-grid product-detail-variant-grid--cond">
                {conditions.map((item, i) => {
                  const isActive = selectedCondition === i
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`product-detail-variant-option${isActive ? ' product-detail-variant-option--active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => setSelectedCondition(i)}
                    >
                      {item.label}
                      {isActive && (
                        <span className="product-detail-variant-check" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="product-detail-qty-block">
            <span className="product-detail-field-label">Số lượng</span>
            <div className="product-detail-qty-row">
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
                onClick={() =>
                  setQty((n) =>
                    stockInfo.stock != null
                      ? Math.min(stockInfo.stock, n + 1)
                      : n + 1,
                  )
                }
                disabled={
                  stockInfo.stock != null && qty >= stockInfo.stock
                }
                aria-label="Tăng"
              >
                +
              </button>
            </div>
            <p
              className={`product-detail-stock-inline${stockInfo.inStock ? '' : ' product-detail-stock-inline--out'}`}
            >
              {!stockInfo.inStock
                ? stockInfo.label
                : stockInfo.stock != null
                  ? `${stockInfo.stock} sản phẩm có sẵn`
                  : stockInfo.label}
            </p>
            </div>
          </div>

          {!isAdmin && (
            <>
              <div className="product-detail-btns">
                <button
                  type="button"
                  className="product-detail-btn product-detail-btn--cart"
                  onClick={() => handleAdd(false)}
                  disabled={!stockInfo.inStock}
                >
                  Thêm vào giỏ hàng
                </button>
                <button
                  type="button"
                  className="product-detail-btn product-detail-btn--buy"
                  onClick={() => handleAdd(true)}
                  disabled={!stockInfo.inStock}
                >
                  Mua ngay
                </button>
              </div>

              {added && (
                <p className="product-detail-added" role="status">
                  ✓ Đã thêm vào giỏ · <Link to="/gio-hang">Xem giỏ hàng</Link>
                </p>
              )}
            </>
          )}

          {hasDescription && (
          <div className="product-detail-desc-block">
            <button
              type="button"
              className="product-detail-desc-head"
              onClick={() => setDescExpanded((v) => !v)}
              aria-expanded={descExpanded}
              aria-label={descExpanded ? 'Thu gọn mô tả' : 'Xem mô tả'}
            >
              <h2 className="product-detail-desc-heading">Mô tả</h2>
              <span className="product-detail-desc-toggle" aria-hidden>
                +
              </span>
            </button>
            <div
              className={`product-detail-desc-wrap${descExpanded ? ' product-detail-desc-wrap--open' : ''}`}
            >
              <div className="product-detail-desc-inner">
                <p className="product-detail-desc">{productDesc}</p>
              </div>
            </div>
          </div>
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
