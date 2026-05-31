import HomeProductCard from '../HomeProductCard/HomeProductCard'
import './HomeProductSection.css'

export default function HomeProductSection({
  title,
  products,
  labels = {},
  variant = 'dark',
}) {
  if (!products?.length) return null

  return (
    <section className="home-product-section">
      <div className="home-section-heading">
        <span className="home-section-line" aria-hidden="true" />
        <h2 className="home-section-title">{title}</h2>
        <span className="home-section-line" aria-hidden="true" />
      </div>
      <ul className="home-section-grid">
        {products.map((p) => (
          <HomeProductCard
            key={p.id}
            product={p}
            label={labels[p.id]}
            variant={variant}
          />
        ))}
      </ul>
    </section>
  )
}
