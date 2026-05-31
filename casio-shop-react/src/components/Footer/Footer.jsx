import { Link } from 'react-router-dom'
import './Footer.css'

const quickLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/cua-hang', label: 'Cửa hàng' },
  { to: '/cua-hang?category=calculator', label: 'Máy tính Casio' },
  { to: '/gio-hang', label: 'Giỏ hàng' },
]

export default function Footer() {
  return (
    <footer className="site-footer" id="lien-he">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Casio Shop
            </Link>
            <p className="footer-tagline">
              Máy tính Casio chính hãng, phụ kiện và balo học sinh.
            </p>
          </div>

          <div className="footer-col">
            <h3>Liên kết</h3>
            <nav className="footer-nav">
              {quickLinks.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="footer-col">
            <h3>Hỗ trợ</h3>
            <ul className="footer-list">
              <li>Chính sách đổi trả</li>
              <li>Hướng dẫn mua hàng</li>
              <li>Kiểm tra bảo hành</li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h3>Liên hệ</h3>
            <ul className="footer-list">
              <li>
                <span className="footer-label">Hotline</span>
                <a href="tel:19001234">1900 1234</a>
              </li>
              <li>
                <span className="footer-label">Email</span>
                <a href="mailto:support@casioshop.vn">support@casioshop.vn</a>
              </li>
              <li>
                <span className="footer-label">Giờ làm việc</span>
                8:00 – 21:00 (T2–CN)
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Casio Shop. Bảo lưu mọi quyền.</p>
          <p className="footer-tech">React + Laravel · Dự án demo</p>
        </div>
      </div>
    </footer>
  )
}
