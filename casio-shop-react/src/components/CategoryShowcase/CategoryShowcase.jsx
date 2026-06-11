import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCategoryShowcaseItems } from '../../config/categories'
import { useCategories } from '../../context/CategoriesContext'
import './CategoryShowcase.css'

export default function CategoryShowcase() {
  const { categories } = useCategories()
  const showcaseItems = useMemo(
    () => getCategoryShowcaseItems(categories),
    [categories],
  )

  return (
    <section className="category-showcase" aria-labelledby="category-showcase-title">
      <div className="category-title-wrap">
        <span className="category-sparkle category-sparkle--left" aria-hidden>
          ✦
        </span>
        <h2 id="category-showcase-title" className="category-showcase-title">
          Danh mục nổi bật
        </h2>
        <span className="category-sparkle category-sparkle--right" aria-hidden>
          ✦
        </span>
      </div>

      <div className="category-grid">
        {showcaseItems.map((item) => (
          <Link key={item.to} to={item.to} className="category-card">
            <div className="category-card-visual">
              <img
                src={item.image}
                alt=""
                className="category-card-figure"
                draggable={false}
              />
            </div>
            <h3 className="category-card-name">{item.title}</h3>
            <span className="category-card-cta">Xem tất cả</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
