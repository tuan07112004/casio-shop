import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../../api/client'
import { products as localProducts } from '../../data/products'
import ProductCard from '../../components/ProductCard/ProductCard'
import './ShopPage.css'

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'calculator', label: 'Máy tính' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'bag', label: 'Balo' },
]

function filterByQuery(list, q) {
  const term = q.trim().toLowerCase()
  if (!term) return list
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)),
  )
}

export default function ShopPage() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || ''
  const [category, setCategory] = useState(
    FILTERS.some((f) => f.value === initialCategory) ? initialCategory : '',
  )
  const [items, setItems] = useState(localProducts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const displayedItems = useMemo(
    () => filterByQuery(items, searchQuery),
    [items, searchQuery],
  )

  useEffect(() => {
    const cat = searchParams.get('category') || ''
    if (FILTERS.some((f) => f.value === cat)) {
      setCategory(cat)
    }
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadCategory = searchQuery.trim() ? '' : category

    fetchProducts(loadCategory || undefined)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) {
          let filtered = loadCategory
            ? localProducts.filter((p) => p.category === loadCategory)
            : localProducts
          setItems(filtered)
          setError('Không kết nối API — đang hiển thị dữ liệu mẫu.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [category, searchQuery])

  return (
    <div className="shop-page">
      <h1>Cửa hàng</h1>
      {searchQuery.trim() ? (
        <p className="shop-desc">
          Kết quả tìm kiếm: <strong>「{searchQuery}」</strong>
          {!loading && ` — ${displayedItems.length} sản phẩm`}
        </p>
      ) : (
        <p className="shop-desc">Máy tính Casio và phụ kiện chính hãng</p>
      )}

      <div className="shop-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={category === f.value ? 'filter active' : 'filter'}
            onClick={() => setCategory(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="shop-notice">{error}</p>}
      {loading && <p className="shop-loading">Đang tải sản phẩm...</p>}

      {!loading && displayedItems.length === 0 && (
        <p className="shop-empty">
          {searchQuery.trim()
            ? 'Không tìm thấy sản phẩm phù hợp.'
            : 'Không có sản phẩm trong danh mục này.'}
        </p>
      )}

      <ul className="product-list">
        {displayedItems.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
    </div>
  )
}
