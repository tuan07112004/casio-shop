import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getShopCategoryUrl } from '../../config/categories'
import { useCategories } from '../../context/CategoriesContext'
import './Footer.css'

export default function Footer() {
  const { categories } = useCategories()

  const productLinks = useMemo(
    () => [
      { to: '/cua-hang', label: 'Tất cả sản phẩm' },
      ...categories.map((c) => ({
        to: getShopCategoryUrl(c.value),
        label: c.shopLabel,
      })),
    ],
    [categories],
  )

  return (
    <footer className="site-footer" id="lien-he">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-col-title">Lytus Casio</h3>
            <p className="footer-tagline">
              Máy tính Casio chính hãng — phụ kiện &amp; balo học sinh.
            </p>
            <p className="footer-about">
              Đại lý phân phối máy tính Casio tại Việt Nam.
            </p>
            <p className="footer-hours">Giờ làm việc: 8:00 – 17:30 (T2–T7)</p>
          </div>

          <div className="footer-col">
            <h3 className="footer-col-title">Sản phẩm</h3>
            <nav className="footer-nav">
              {productLinks.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-col">
            <h3 className="footer-col-title">Hỗ trợ</h3>
            <nav className="footer-nav">
              <Link to="/faq">Câu hỏi thường gặp</Link>
              <Link to="/tra-cuu-don">Tra cứu đơn hàng</Link>
            </nav>
          </div>
        </div>

        <p className="footer-copy">© {new Date().getFullYear()} Lytus Casio Shop</p>
      </div>
    </footer>
  )
}
