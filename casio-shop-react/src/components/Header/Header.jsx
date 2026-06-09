import { useEffect, useMemo, useRef, useState } from 'react'
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
import HeaderSalePromo from '../HeaderSalePromo/HeaderSalePromo'
import './Header.css'

const LIVE_SEARCH_LIMIT = 6

const productLinks = [
  { to: '/cua-hang?category=may-tinh', label: 'Máy tính Casio' },
  { to: '/cua-hang?category=phu-kien', label: 'Văn phòng phẩm' },
  { to: '/cua-hang?category=balo', label: 'Cặp, Ba lô' },
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
          +
        </span>
      </button>
      <ul className="nav-dropdown-menu">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="nav-dropdown-item">
              <span>{item.label}</span>
              <span className="nav-dropdown-item-plus" aria-hidden>
                +
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const menuIcons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  lookup: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  ),
  login: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  register: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

function AccountMenu({ isLoggedIn, user, booting, isAdmin, logout }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  const firstName = user?.name?.split(' ')[0] || ''

  return (
    <div
      className={`header-account-wrap${open ? ' is-open' : ''}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="header-account header-account-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Tài khoản"
      >
        {accountIcon}
        <span className="header-account-text">
          <span className="header-account-label">Tài khoản</span>
          <span className="header-account-action">
            {isLoggedIn
              ? booting
                ? '...'
                : `Hi, ${firstName}`
              : 'Đăng nhập'}
          </span>
        </span>
        <span className="header-account-chevron" aria-hidden />
      </button>

      {open && (
        <div className="header-account-panel" role="menu">
          {isLoggedIn && !booting && (
            <div className="header-account-panel-head">
              <strong>{user.name}</strong>
              {user.email && <span>{user.email}</span>}
            </div>
          )}

          <ul className="header-account-menu">
            {isLoggedIn ? (
              <>
                <li>
                  <Link
                    to="/tai-khoan"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.overview}
                    Tổng quan
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tai-khoan/don-hang"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.orders}
                    Đơn hàng của tôi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tai-khoan/tra-cuu"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.lookup}
                    Tra cứu đơn hàng
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      className="header-account-menu-item"
                      role="menuitem"
                      onClick={close}
                    >
                      {menuIcons.admin}
                      Quản trị
                    </Link>
                  </li>
                )}
                <li className="header-account-menu-divider" aria-hidden />
                <li>
                  <button
                    type="button"
                    className="header-account-menu-item header-account-menu-item--logout"
                    role="menuitem"
                    onClick={() => {
                      close()
                      logout()
                    }}
                  >
                    {menuIcons.logout}
                    Đăng xuất
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/dang-nhap"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.login}
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dang-ky"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.register}
                    Đăng ký
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tra-cuu-don"
                    className="header-account-menu-item"
                    role="menuitem"
                    onClick={close}
                  >
                    {menuIcons.lookup}
                    Tra cứu đơn hàng
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
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

  const isAccountPage =
    location.pathname.startsWith('/tai-khoan') ||
    location.pathname === '/tra-cuu-don'
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

            <AccountMenu
              isLoggedIn={isLoggedIn}
              user={user}
              booting={booting}
              isAdmin={isAdmin}
              logout={logout}
            />

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

      {!isAccountPage && (
        <nav className="header-menu" aria-label="Menu chính">
          <div className="header-menu-inner">
            <HeaderSalePromo />
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
            <NavDropdown label="Sản phẩm" links={productLinks} />
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
      )}
    </>
  )
}