import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { fetchProducts, filterProductsByQuery } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import useAnimated from '../../hooks/useAnimated'
import { formatPrice, productImageSrc } from '../../utils/format'
import './Header.css'

const LIVE_SEARCH_LIMIT = 6

const productLinks = [
  { to: '/cua-hang', label: 'Tất cả sản phẩm' },
  { to: '/cua-hang?category=may-tinh', label: 'Máy tính' },
  { to: '/cua-hang?category=phu-kien', label: 'Phụ kiện' },
  { to: '/cua-hang?category=balo', label: 'Balo' },
]

const accountIcon = (
  <span className="header-account-icon" aria-hidden>
    <img
      src="/images/icon/iconAcc.png"
      alt=""
      className="header-account-icon-img"
      width={28}
      height={28}
    />
  </span>
)

function NavDropdown({ label, links, icon }) {
  return (
    <div className="nav-dropdown">
      <button type="button" className="nav-link nav-dropdown-toggle">
        {icon && <img src={icon} alt="" className="nav-link-icon" />}
        {label}
        <span className="nav-chevron" aria-hidden>
          +{' '}
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
  const { user, isLoggedIn, logout, booting, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [products, setProducts] = useState([])
  const showAnimatedPlaceholder = !query && !searchFocused
  const animatedPlaceholder = useAnimated(showAnimatedPlaceholder)

  const trimmedQuery = query.trim()
  const liveMatches = useMemo(
    () => filterProductsByQuery(products, trimmedQuery),
    [products, trimmedQuery],
  )
  const livePreview = liveMatches.slice(0, LIVE_SEARCH_LIMIT)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams, location.pathname])

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [])

  useEffect(() => {
    if (!searchFocused) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSearchFocused(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [searchFocused])

  const handleSearch = (e) => {
    e.preventDefault()
    closeSearch()
    if (trimmedQuery) navigate(`/cua-hang?q=${encodeURIComponent(trimmedQuery)}`)
    else navigate('/cua-hang')
  }

  const closeSearch = () => setSearchFocused(false)

  return (
    <>
      {searchFocused && (
        <button
          type="button"
          className="header-search-backdrop"
          aria-label="Đóng tìm kiếm"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault()
            closeSearch()
          }}
        />
      )}

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

            <div
              className={`header-search-wrap${searchFocused ? ' is-search-active' : ''}`}
            >
              <div className="header-search-shell">
              <form
                className="header-search"
                onSubmit={handleSearch}
                role="search"
              >
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
                    onBlur={() => {
                      window.setTimeout(() => setSearchFocused(false), 120)
                    }}
                    placeholder=""
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="header-search-btn"
                  aria-label="Tìm kiếm"
                >
                  <img
                    src="/images/icon/iconSearch.png"
                    alt=""
                    className="header-search-icon"
                  />
                </button>
              </form>

              {searchFocused && (
                <div
                  className="header-search-panel"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {trimmedQuery ? (
                    <>
                      <div className="header-search-panel-head">
                        Kết quả tìm kiếm cho{' '}
                        <strong>&ldquo;{trimmedQuery}&rdquo;</strong>
                      </div>
                      {livePreview.length > 0 ? (
                        <ul className="header-search-results">
                          {livePreview.map((p) => (
                            <li key={p.id}>
                              <Link
                                to={`/san-pham/${p.id}`}
                                className="header-search-result"
                                onClick={closeSearch}
                              >
                                <img
                                  src={productImageSrc(p.image)}
                                  alt=""
                                  className="header-search-result-img"
                                />
                                <span className="header-search-result-info">
                                  <span className="header-search-result-name">
                                    {p.name}
                                  </span>
                                  <span className="header-search-result-price">
                                    {formatPrice(p.price)}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="header-search-empty">
                          Không tìm thấy sản phẩm phù hợp.
                        </p>
                      )}
                      {liveMatches.length > 0 && (
                        <Link
                          to={`/cua-hang?q=${encodeURIComponent(trimmedQuery)}`}
                          className="header-search-view-all"
                          onClick={closeSearch}
                        >
                          Xem tất cả {liveMatches.length} kết quả
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="header-search-hints">
                      <button
                        type="button"
                        className="header-search-hint"
                        onClick={() => {
                          closeSearch()
                          navigate('/cua-hang?category=may-tinh')
                        }}
                      >
                        máy tính casio
                      </button>
                      <button
                        type="button"
                        className="header-search-hint"
                        onClick={() => {
                          closeSearch()
                          navigate('/cua-hang?category=phu-kien')
                        }}
                      >
                        phụ kiện máy tính
                      </button>
                      <button
                        type="button"
                        className="header-search-hint"
                        onClick={() => {
                          closeSearch()
                          navigate('/cua-hang?category=balo')
                        }}
                      >
                        balo học sinh
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                <span className="header-support-phone">0988 480 655</span>
              </span>
            </a>

            {isLoggedIn ? (
              <div className="header-account">
                {accountIcon}
                <span className="header-account-text">
                  <span className="header-account-label">Tài khoản</span>
                  <span className="header-account-action">
                    {booting ? '...' : `Hi, ${user.name.split(' ')[0]}`}
                  </span>
                  <Link to="/don-hang-cua-toi" className="header-account-orders">
                    Đơn hàng của tôi
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="header-account-admin">
                      Quản trị
                    </Link>
                  )}
                </span>
                <button
                  type="button"
                  className="header-logout-btn"
                  onClick={() => logout()}
                >
                  Thoát
                </button>
              </div>
            ) : (
              <Link to="/dang-nhap" className="header-account">
                {accountIcon}
                <span className="header-account-text">
                  <span className="header-account-label">Tài khoản</span>
                  <span className="header-account-action">Đăng nhập</span>
                </span>
              </Link>
            )}

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
          <NavDropdown
            label="Sản phẩm"
            links={productLinks}
            icon="/images/icon/iconSanPham.png"
          />
          <NavLink
            to="/tin-tuc"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            <img
              src="/images/icon/iconTinTuc.png"
              alt=""
              className="nav-link-icon"
            />
            Tin tức
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            FAQ
          </NavLink>
        </div>
      </nav>
    </>
  )
}