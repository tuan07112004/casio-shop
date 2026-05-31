import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import useAnimatedPlaceholder from '../../hooks/useAnimatedPlaceholder'
import './Header.css'

const productLinks = [
  { to: '/cua-hang', label: 'Tất cả sản phẩm' },
  { to: '/cua-hang?category=calculator', label: 'Máy tính' },
  { to: '/cua-hang?category=accessory', label: 'Phụ kiện' },
  { to: '/cua-hang?category=bag', label: 'Balo' },
]

function NavDropdown({ label, links, icon }) {
  return (
    <div className="nav-dropdown">
      <button type="button" className="nav-link nav-dropdown-toggle">
        {icon && <img src={icon} alt="" className="nav-link-icon" />}
        {label}
        <span className="nav-chevron" aria-hidden>
          +
        </span>
      </button>
      <ul className="nav-dropdown-menu">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Header() {
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const showAnimatedPlaceholder = !query && !searchFocused
  const animatedPlaceholder = useAnimatedPlaceholder(showAnimatedPlaceholder)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams, location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      navigate(`/cua-hang?q=${encodeURIComponent(q)}`)
    } else {
      navigate('/cua-hang')
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-main">
          <Link to="/" className="header-logo">
            <img
              src="/images/logo.png"
              alt="Casio Shop"
              className="header-logo-img"
            />
          </Link>

          <div className="header-search-wrap">
            <form className="header-search" onSubmit={handleSearch} role="search">
              <label htmlFor="header-search-input" className="sr-only">
                Tìm theo tên sản phẩm
              </label>
              <div className="header-search-field">
                {showAnimatedPlaceholder && (
                  <span className="header-search-animated" aria-hidden>
                    {animatedPlaceholder}
                    <span className="header-search-cursor">|</span>
                  </span>
                )}
                <input
                  id="header-search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder=""
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="header-search-btn"
                aria-label="Tìm kiếm"
              >
                <svg
                  className="header-search-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 16l5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </form>
            <div className="header-search-hints">
              <button
                type="button"
                className="header-search-hint"
                onClick={() => navigate('/cua-hang?category=calculator')}
              >
                máy tính casio
              </button>
              <button
                type="button"
                className="header-search-hint"
                onClick={() => navigate('/cua-hang?category=accessory')}
              >
                phụ kiện máy tính
              </button>
              <button
                type="button"
                className="header-search-hint"
                onClick={() => navigate('/cua-hang?category=bag')}
              >
                balo học sinh
              </button>
            </div>
          </div>

          <a href="tel:19002152" className="header-support">
            <img
              src="/images/icon/iconGoi.png"
              alt=""
              className="header-support-icon"
              width={40}
              height={40}
            />
            <span className="header-support-text">
              <span className="header-support-label">Hỗ trợ khách hàng</span>
              <span className="header-support-phone">1900 2152</span>
            </span>
          </a>

          <Link to="/#lien-he" className="header-account">
            <span className="header-account-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path
                  d="M4 20c0-4 4-6 8-6s8 2 8 6"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="header-account-text">
              <span className="header-account-label">Tài khoản</span>
              <span className="header-account-action">Đăng nhập</span>
            </span>
          </Link>

          <NavLink
            to="/gio-hang"
            className={({ isActive }) =>
              `header-cart${isActive ? ' active' : ''}`
            }
          >
            <img
              src="/images/icon/iconGioHang.png"
              alt=""
              className="header-cart-icon"
              width={32}
              height={32}
            />
            <span className="header-cart-label">Giỏ hàng</span>
            {totalItems > 0 && (
              <span className="header-cart-badge">{totalItems}</span>
            )}
          </NavLink>
          </div>
        </div>
      </header>

      <nav className="header-menu" aria-label="Menu chính">
        <div className="header-menu-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            <img
              src="/images/icon/iconTrangChu.png"
              alt=""
              className="nav-link-icon"
            />
            Trang chủ
          </NavLink>

          <Link to="/#gioi-thieu" className="nav-link">
            <img
              src="/images/icon/iconGioiThieu.png"
              alt=""
              className="nav-link-icon nav-link-icon--clear"
            />
            Giới thiệu
          </Link>

          <NavDropdown
            label="Sản phẩm"
            links={productLinks}
            icon="/images/icon/iconSanPham.png"
          />

          <NavLink
            to="/cua-hang"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            <img
              src="/images/icon/iconTinTuc.png"
              alt=""
              className="nav-link-icon nav-link-icon--clear"
            />
            Tin tức
          </NavLink>
        </div>
      </nav>
    </>
  )
}
