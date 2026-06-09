import { useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../../api/client'
import ProductCard from '../ProductCard/ProductCard'
import { sortMayTinh } from '../../utils/productCard'
import '../ProductShowcase/ProductShowcase.css'
import './SimilarProducts.css'

const MAX_SIMILAR = 4

export default function SimilarProducts({ product }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const similar = useMemo(() => {
    if (!product) return []
    let list = products.filter(
      (p) => p.category === product.category && p.id !== product.id,
    )
    if (product.category === 'may-tinh') list = sortMayTinh(list)
    return list.slice(0, MAX_SIMILAR)
  }, [products, product])

  if (loading || !similar.length) return null

  return (
    <section
      className="similar-products"
      aria-labelledby="similar-products-title"
    >
      <div className="similar-products-inner">
        <div className="similar-products-head">
          <div className="product-showcase-title-wrap">
            <h2 id="similar-products-title" className="product-showcase-title">
              Sản phẩm tương tự
            </h2>
            <span
              className="product-showcase-sparkle product-showcase-sparkle--right"
              aria-hidden
            >
              ✦
            </span>
          </div>
        </div>

        <ul className="similar-products-grid">
          {similar.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </ul>
      </div>
    </section>
  )
}
