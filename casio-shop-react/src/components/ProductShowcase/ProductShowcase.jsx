import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/client'
import { formatPrice, productImageSrc } from '../../utils/format'
import './ProductShowcase.css'

const SECTIONS = [
  {
    key: 'may-tinh',
    title: 'Máy tính Casio',
    shopUrl: '/cua-hang?category=may-tinh',
  },
  {
    key: 'balo',
    title: 'Balo',
    shopUrl: '/cua-hang?category=balo',
  },
  {
    key: 'phu-kien',
    title: 'Phụ kiện',
    shopUrl: '/cua-hang?category=phu-kien',
  },
]

const LIMIT = 3

function getOriginalPrice(price) {
  return Math.ceil((price * 1.15) / 1000) * 1000
}

function ProductCard({ product }) {
  const cat = product.category || 'phu-kien'
  const originalPrice = getOriginalPrice(product.price)

  return (
    <li className="product-showcase-card">
      <Link to={`/san-pham/${product.id}`} className="product-showcase-link">
        <div className={`product-showcase-visual product-showcase-visual--${cat}`}>
          <img
            className="product-showcase-img"
            src={productImageSrc(product.image)}
            alt={product.name}
            loading="lazy"
          />
        </div>
        <div className="product-showcase-body">
          <h3 className="product-showcase-name">{product.name}</h3>
          <div className="product-showcase-prices">
            <span className="product-showcase-price-original">
              {formatPrice(originalPrice)}
            </span>
            <span className="product-showcase-price-sale">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}

export default function ProductShowcase() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const byCategory = useMemo(() => {
    const map = { 'may-tinh': [], balo: [], 'phu-kien': [] }
    for (const p of products) {
      if (map[p.category]) map[p.category].push(p)
    }
    return map
  }, [products])

  const visibleSections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        products: (byCategory[section.key] || []).slice(0, LIMIT),
      })).filter((section) => section.products.length > 0),
    [byCategory],
  )

  if (loading) {
    return (
      <section className="product-showcase">
        <p className="product-showcase-status">Đang tải sản phẩm...</p>
      </section>
    )
  }

  if (!visibleSections.length) return null

  return (
    <div className="product-showcase">
      {visibleSections.map((section) => (
        <section
          key={section.key}
          className="product-showcase-section"
          aria-labelledby={`product-showcase-${section.key}`}
        >
          <div className="product-showcase-head">
            <div className="product-showcase-title-wrap">
              <span className="product-showcase-sparkle product-showcase-sparkle--left" aria-hidden>
                ✦
              </span>
              <h2 id={`product-showcase-${section.key}`} className="product-showcase-title">
                {section.title}
              </h2>
              <span className="product-showcase-sparkle product-showcase-sparkle--right" aria-hidden>
                ✦
              </span>
            </div>
            <Link
              to={section.shopUrl}
              className="product-showcase-view-all"
            >
              Xem tất cả →
            </Link>
          </div>

          <ul className="product-showcase-grid">
            {section.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
