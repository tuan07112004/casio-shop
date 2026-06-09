import { Link } from 'react-router-dom'
import './Footer.css'

const PRODUCT_LINKS = [
  { to: '/cua-hang', label: 'Tất cả sản phẩm' },
  { to: '/cua-hang?category=may-tinh', label: 'Máy tính' },
  { to: '/cua-hang?category=phu-kien', label: 'Phụ kiện' },
  { to: '/cua-hang?category=balo', label: 'Balo' },
]

export default function Footer() {
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
              {PRODUCT_LINKS.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-col">
            <h3 className="footer-col-title">Hỗ trợ</h3>
            <nav className="footer-nav">
              <Link to="/">Trang chủ</Link>
              <Link to="/gio-hang">Giỏ hàng</Link>
              <Link to="/tra-cuu-don">Tra cứu đơn hàng</Link>
              <Link to="/faq">FAQ</Link>
              <a href="tel:19002152">Hotline: 1900 2152</a>
              <a href="mailto:lytuscasio@gmail.com">lytuscasio@gmail.com</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
