import { useEffect, useMemo, useState } from 'react'

import { Link, useSearchParams } from 'react-router-dom'

import { fetchProducts, filterProductsByQuery } from '../../api/client'

import { formatPrice, productImageSrc } from '../../utils/format'

import '../../components/ProductShowcase/ProductShowcase.css'

import './ShopPage.css'



const SHOP_SECTIONS = [

  { key: 'may-tinh', title: 'Máy tính Casio' },

  { key: 'balo', title: 'Balo' },

  { key: 'phu-kien', title: 'Phụ kiện' },

]



const CATEGORY_ALIASES = {

  calculator: 'may-tinh',

  'may-tinh': 'may-tinh',

  accessory: 'phu-kien',

  'phu-kien': 'phu-kien',

  bag: 'balo',

  balo: 'balo',

}



function normalizeCategory(raw) {

  if (!raw) return ''

  return CATEGORY_ALIASES[raw.toLowerCase()] || raw

}



function getOriginalPrice(price) {

  return Math.ceil((price * 1.15) / 1000) * 1000

}



function ShopProductCard({ product }) {

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



function SectionTitle({ id, title }) {

  return (

    <div className="product-showcase-head">

      <div className="product-showcase-title-wrap">

        <span className="product-showcase-sparkle product-showcase-sparkle--left" aria-hidden>

          ✦

        </span>

        <h2 id={id} className="product-showcase-title">

          {title}

        </h2>

        <span className="product-showcase-sparkle product-showcase-sparkle--right" aria-hidden>

          ✦

        </span>

      </div>

    </div>

  )

}



export default function ShopPage() {

  const [searchParams] = useSearchParams()

  const q = (searchParams.get('q') || '').trim().toLowerCase()

  const categoryFilter = normalizeCategory(searchParams.get('category') || '')



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

    if (categoryFilter) {

      list = list.filter((p) => p.category === categoryFilter)

    }

    if (q) {

      list = filterProductsByQuery(list, searchParams.get('q') || '')

    }

    return list

  }, [products, categoryFilter, q, searchParams])



  const grouped = useMemo(() => {

    const map = Object.fromEntries(SHOP_SECTIONS.map((s) => [s.key, []]))

    for (const p of filtered) {

      if (map[p.category]) map[p.category].push(p)

    }

    return map

  }, [filtered])



  const activeSections = useMemo(() => {

    if (categoryFilter) {

      return SHOP_SECTIONS.filter((s) => s.key === categoryFilter)

    }

    return SHOP_SECTIONS

  }, [categoryFilter])



  const categoryTitle = useMemo(() => {

    if (!categoryFilter) return ''

    return SHOP_SECTIONS.find((s) => s.key === categoryFilter)?.title || 'Cửa hàng'

  }, [categoryFilter])



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

  const showSearchHeader = !!q

  const showCategoryHeader = !!categoryFilter && !q



  return (

    <div className="shop-page product-showcase">

      {showSearchHeader && (

        <header className="shop-search-header">

          <p className="shop-search-label">Kết quả tìm kiếm</p>

          <h1 className="shop-search-query">&ldquo;{searchParams.get('q')}&rdquo;</h1>

          <p className="shop-search-meta">

            {filtered.length} sản phẩm

            {' · '}

            <Link to="/cua-hang" className="shop-clear-filter">

              Xem tất cả

            </Link>

          </p>

        </header>

      )}



      {showCategoryHeader && (

        <header className="shop-search-header shop-search-header--compact">

          <SectionTitle id="shop-category-title" title={categoryTitle} />

          <p className="shop-search-meta">

            {filtered.length} sản phẩm

            {' · '}

            <Link to="/cua-hang" className="shop-clear-filter">

              Xem tất cả

            </Link>

          </p>

        </header>

      )}



      {!hasResults && (

        <p className="product-showcase-status">Không tìm thấy sản phẩm phù hợp.</p>

      )}



      {activeSections.map((section) => {

        const list = grouped[section.key]

        if (!list?.length) return null



        const showSectionTitle = !categoryFilter && !q



        return (

          <section

            key={section.key}

            className="product-showcase-section"

            aria-labelledby={`shop-section-${section.key}`}

          >

            {showSectionTitle && (

              <SectionTitle id={`shop-section-${section.key}`} title={section.title} />

            )}



            <ul className="product-showcase-grid">

              {list.map((p) => (

                <ShopProductCard key={p.id} product={p} />

              ))}

            </ul>

          </section>

        )

      })}

    </div>

  )

}


