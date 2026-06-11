import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProducts, filterProductsByQuery } from '../../api/client'
import ProductCard from '../../components/ProductCard/ProductCard'
import { sortMayTinh } from '../../utils/productCard'
import '../../components/ProductShowcase/ProductShowcase.css'
import './ShopPage.css'

import {
  getShopSections,
  normalizeCategoryKey,
} from '../../config/categories'
import { useCategories } from '../../context/CategoriesContext'

function productCategoryKey(category) {
  return normalizeCategoryKey(category)
}

function ShopCategoryTabs({ activeKey, sections }) {
  return (
    <nav className="shop-category-tabs" aria-label="Danh mục sản phẩm">
      {sections.map((section) => {
        const isActive = section.key === activeKey
        return (
          <Link
            key={section.key}
            to={`/cua-hang?category=${section.key}`}
            className={`shop-category-tab${isActive ? ' shop-category-tab--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {section.title}
          </Link>
        )
      })}
    </nav>
  )
}

export default function ShopPage() {
  const { categories } = useCategories()
  const shopSections = useMemo(() => getShopSections(categories), [categories])
  const [searchParams] = useSearchParams()
  const q = (searchParams.get('q') || '').trim()
  const categoryFilter = normalizeCategoryKey(searchParams.get('category') || '')
  const activeCategory = categoryFilter || shopSections[0]?.key || 'may-tinh'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = products

    if (q) {
      list = filterProductsByQuery(list, q)
      return list
    }

    list = list.filter((p) => productCategoryKey(p.category) === activeCategory)
    return activeCategory === 'may-tinh' ? sortMayTinh(list) : list
  }, [products, activeCategory, q])

  if (loading) {
    return (
      <div className="shop-page">
        <p className="product-showcase-status">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="shop-page">
        <p className="shop-status shop-status--error">Lỗi: {error}</p>
      </div>
    )
  }

  const hasResults = filtered.length > 0
  const isSearchMode = !!q

  return (
    <div className="shop-page product-showcase">
      {isSearchMode ? (
        <header className="shop-search-header">
          <p className="shop-search-label">Kết quả tìm kiếm</p>
          <h1 className="shop-search-query">&ldquo;{q}&rdquo;</h1>
          <p className="shop-search-meta">
            {filtered.length} sản phẩm
            {' · '}
            <Link to="/cua-hang" className="shop-clear-filter">
              Xem tất cả
            </Link>
          </p>
        </header>
      ) : (
        <ShopCategoryTabs activeKey={activeCategory} sections={shopSections} />
      )}

      {!hasResults && (
        <p className="product-showcase-status">Không tìm thấy sản phẩm phù hợp.</p>
      )}

      {hasResults && (
        <section className="product-showcase-section shop-page-products">
          <ul className="product-showcase-grid product-showcase-grid--shop">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
