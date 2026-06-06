import { Link } from 'react-router-dom'
import './CategoryShowcase.css'

const categories = [
  {
    title: 'Máy tính',
    image: '/images/MaytinhRemove.png',
    to: '/cua-hang?category=calculator',
  },
  {
    title: 'Đô dùng học tập',
    image: '/images/phukienRemove.png',
    to: '/cua-hang?category=accessory',
  },
  {
    title: 'Balo thời trang',
    image: '/images/baloRmove.png',
    to: '/cua-hang?category=bag',
  },
]

export default function CategoryShowcase() {
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
        {categories.map((item) => (
          <Link key={item.title} to={item.to} className="category-card">
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