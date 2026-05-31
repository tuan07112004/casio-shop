import Button from '../Button/Button'
import './Banner.css'

export default function Banner() {
  return (
    <section className="banner-hero" aria-label="Banner Casio fx-580">
      <img
        src="/images/banner.png"
        alt="Casio fx-580 — 521 tính năng"
        className="banner-hero-img"
        fetchPriority="high"
      />
      <div className="banner-hero-actions">
        <Button content="Xem sản phẩm" to="/cua-hang" />
      </div>
    </section>
  )
}
