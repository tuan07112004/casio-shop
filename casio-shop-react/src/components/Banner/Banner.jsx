import Button from '../Button/Button'
import './Banner.css'

export default function Banner() {
  return (
    <section className="banner-hero" aria-label="Banner Casio">
      <div className="banner-hero-media">
        <img
          src="/images/banner.png"
          alt="Casio fx-580 — 521 tính năng"
          className="banner-hero-img"
          width={1000}
          height={415}
          fetchPriority="high"
        />
      </div>
      <div className="banner-hero-actions">
        <Button content="Xem sản phẩm" to="/cua-hang" />
      </div>
    </section>
  )
}