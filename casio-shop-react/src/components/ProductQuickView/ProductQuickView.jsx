import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useQuickView } from '../../context/QuickViewContext'
import {
  getColorPreviewImages,
  getColorSwatches,
  getMachineTypeGroup,
  getProductConditions,
  getProductDiscountPercent,
} from '../../utils/productCard'
import { getProductGallery } from '../../utils/productGallery'
import { formatPrice, productImageSrc } from '../../utils/format'
import {
  collectOptionIds,
  getStockInfo,
  productDetailPath,
  resolveLineBasePrice,
  resolveLinePrice,
} from '../../utils/cartLine'
import './ProductQuickView.css'

export default function ProductQuickView() {
  const { product, closeQuickView } = useQuickView()
  const { isAdmin } = useAuth()
  const { addToCart, openMiniCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [selectedCondition, setSelectedCondition] = useState(0)
  const [activeImage, setActiveImage] = useState(0)
  const [imageSource, setImageSource] = useState('variant')
  const [qty, setQty] = useState(1)

  const machineTypes = product ? getMachineTypeGroup(product) : null
  const colorSwatches = product ? getColorSwatches(product) : null
  const variantOptions = machineTypes?.options || colorSwatches
  const variantLabel = machineTypes?.label || 'Màu sắc'
  const conditions = product ? getProductConditions(product) : null
  const previewImages = product ? getColorPreviewImages(product) : null

  const galleryImages = useMemo(() => {
    if (!product) return []
    return getProductGallery(product).filter((item) => item.type === 'image')
  }, [product])

  useEffect(() => {
    if (!product) return
    setSelectedVariant(0)
    setSelectedCondition(0)
    setActiveImage(0)
    setImageSource('variant')
    setQty(1)
  }, [product])

  useEffect(() => {
    if (!product) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [product])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeQuickView()
    }
    if (product) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [product, closeQuickView])

  if (!product) return null

  const optionIds = collectOptionIds(product, selectedVariant, selectedCondition)
  const basePrice = resolveLineBasePrice(product, optionIds)
  const salePrice = resolveLinePrice(product, optionIds)
  const originalPrice = salePrice < basePrice ? basePrice : 0
  const discount = getProductDiscountPercent(product)
  const stockInfo = getStockInfo(product, selectedVariant, selectedCondition)

  const mainImageSrc = (() => {
    if (imageSource === 'gallery' && galleryImages[activeImage]?.src) {
      return galleryImages[activeImage].src
    }
    if (previewImages?.[selectedVariant]) {
      return previewImages[selectedVariant]
    }
    return galleryImages[activeImage]?.src || productImageSrc(product.image)
  })()

  const selectGalleryImage = (index) => {
    setActiveImage(index)
    setImageSource('gallery')
  }

  const selectVariant = (index) => {
    setSelectedVariant(index)
    setImageSource('variant')
  }

  const handleAdd = () => {
    addToCart(product, qty, {
      variantIndex: selectedVariant,
      conditionIndex: selectedCondition,
    })
    closeQuickView()
    openMiniCart()
  }

  return (
    <div className="quick-view-root" role="presentation">
      <button
        type="button"
        className="quick-view-backdrop"
        aria-label="Đóng"
        onClick={closeQuickView}
      />
      <div className="quick-view-dialog" role="dialog" aria-modal="true" aria-label="Xem nhanh sản phẩm">
        <button
          type="button"
          className="quick-view-close"
          onClick={closeQuickView}
          aria-label="Đóng"
        >
          ×
        </button>

        <div className="quick-view-layout">
          <div className="quick-view-gallery">
            {galleryImages.length > 1 && (
              <div className="quick-view-thumbs">
                {galleryImages.slice(0, 6).map((item, i) => (
                  <button
                    key={`${item.src}-${i}`}
                    type="button"
                    className={`quick-view-thumb${imageSource === 'gallery' && activeImage === i ? ' quick-view-thumb--active' : ''}`}
                    onClick={() => selectGalleryImage(i)}
                    onMouseEnter={() => selectGalleryImage(i)}
                  >
                    <img src={item.src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="quick-view-stage">
              <img key={mainImageSrc} src={mainImageSrc} alt={product.name} />
            </div>
          </div>

          <div className="quick-view-info">
            <h2 className="quick-view-name">{product.name}</h2>
            <p
              className={`quick-view-stock${stockInfo.inStock ? '' : ' quick-view-stock--out'}`}
            >
              {stockInfo.label}
            </p>

            <div className="quick-view-prices">
              <span className="quick-view-price-sale">{formatPrice(salePrice)}</span>
              {discount > 0 && (
                <span className="quick-view-price-original">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {variantOptions && (
              <div className="quick-view-field">
                <span className="quick-view-label">{variantLabel}</span>
                <div className="quick-view-options">
                  {machineTypes
                    ? machineTypes.options.map((opt, i) => (
                        <button
                          key={opt.id || opt.label}
                          type="button"
                          className={`quick-view-chip${selectedVariant === i ? ' quick-view-chip--active' : ''}`}
                          onClick={() => selectVariant(i)}
                        >
                          {opt.label}
                        </button>
                      ))
                    : colorSwatches.map((swatch, i) => (
                        <button
                          key={swatch.label}
                          type="button"
                          className={`quick-view-swatch${selectedVariant === i ? ' quick-view-swatch--active' : ''}`}
                          title={swatch.label}
                          onClick={() => selectVariant(i)}
                        >
                          <span style={{ backgroundColor: swatch.hex }} />
                        </button>
                      ))}
                </div>
              </div>
            )}

            {conditions && (
              <div className="quick-view-field">
                <span className="quick-view-label">Độ mới</span>
                <div className="quick-view-options">
                  {conditions.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`quick-view-chip${selectedCondition === i ? ' quick-view-chip--active' : ''}`}
                      onClick={() => setSelectedCondition(i)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isAdmin && (
              <>
                <div className="quick-view-field">
                  <span className="quick-view-label">Số lượng</span>
                  <div className="quick-view-qty">
                    <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQty((n) =>
                          stockInfo.stock != null
                            ? Math.min(stockInfo.stock, n + 1)
                            : n + 1,
                        )
                      }
                      disabled={stockInfo.stock != null && qty >= stockInfo.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="quick-view-buy"
                  onClick={handleAdd}
                  disabled={!stockInfo.inStock}
                >
                  Thêm vào giỏ
                </button>
              </>
            )}

            <Link
              to={productDetailPath(product)}
              className="quick-view-detail-link"
              onClick={closeQuickView}
            >
              Xem chi tiết sản phẩm →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
