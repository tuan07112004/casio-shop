import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/client'
import ProductCard from '../ProductCard/ProductCard'
import { sortMayTinh } from '../../utils/productCard'
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

const VISIBLE_COUNT = 3

function ProductCarousel({ products }) {
  const [index, setIndex] = useState(0)
  const maxIndex = Math.max(0, products.length - VISIBLE_COUNT)
  const showArrows = products.length > VISIBLE_COUNT

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex, products.length])

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(maxIndex, i + 1))

  if (!showArrows) {
    return (
      <ul className="product-showcase-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    )
  }

  const slidePercent =
    products.length > 0 ? (index * 100) / products.length : 0

  return (
    <div className="product-showcase-carousel product-showcase-carousel--arrows">
      <button
        type="button"
        className="product-showcase-arrow product-showcase-arrow--prev"
        onClick={goPrev}
        disabled={index === 0}
        aria-label="Sản phẩm trước"
      >
        ‹
      </button>

      <div className="product-showcase-viewport">
        <ul
          className="product-showcase-track"
          style={{
            '--slide-count': products.length,
            transform: `translateX(-${slidePercent}%)`,
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="product-showcase-arrow product-showcase-arrow--next"
        onClick={goNext}
        disabled={index >= maxIndex}
        aria-label="Sản phẩm sau"
      >
        ›
      </button>
    </div>
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
    map['may-tinh'] = sortMayTinh(map['may-tinh'])
    return map
  }, [products])

  const visibleSections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        products: byCategory[section.key] || [],
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

          <ProductCarousel products={section.products} />
        </section>
      ))}
    </div>
  )
}
