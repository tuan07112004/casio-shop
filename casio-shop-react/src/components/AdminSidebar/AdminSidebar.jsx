import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './AdminSidebar.css'

const NAV_GROUPS = [
  {
    title: 'Quản lý đơn hàng',
    items: [
      { to: '/admin/don-hang', label: 'Tất cả đơn hàng' },
      { to: '/admin/ma-giam-gia', label: 'Mã giảm giá của shop' },
      { to: '/admin/khuyen-mai', label: 'Khuyến mãi của shop' },
      { to: '/admin/phan-tich', label: 'Phân tích bán hàng' },
    ],
  },
  {
    title: 'Quản lý sản phẩm',
    items: [
      { to: '/admin/san-pham', label: 'Tất cả sản phẩm', end: true },
      { to: '/admin/san-pham/them', label: 'Thêm sản phẩm' },
    ],
  },
  {
    title: 'Chăm sóc khách hàng',
    items: [{ to: '/admin/chat', label: 'Quản lý chat' }],
  },
]

function isItemActive(pathname, item) {
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function groupIsActive(pathname, items) {
  return items.some((item) => isItemActive(pathname, item))
}

function initialOpenState(pathname) {
  return Object.fromEntries(
    NAV_GROUPS.map((group) => [group.title, groupIsActive(pathname, group.items)]),
  )
}

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const [openGroups, setOpenGroups] = useState(() => initialOpenState(pathname))

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      NAV_GROUPS.forEach((group) => {
        if (groupIsActive(pathname, group.items)) {
          next[group.title] = true
        }
      })
      return next
    })
  }, [pathname])

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <aside className="admin-sidebar" aria-label="Menu quản trị">
      <NavLink to="/admin" end className="admin-sidebar-home">
        Tổng quan
      </NavLink>

      {NAV_GROUPS.map((group) => {
        const isOpen = !!openGroups[group.title]

        return (
          <div
            key={group.title}
            className={`admin-sidebar-group${isOpen ? ' admin-sidebar-group--open' : ''}`}
          >
            <button
              type="button"
              className="admin-sidebar-group-toggle"
              onClick={() => toggleGroup(group.title)}
              aria-expanded={isOpen}
            >
              <span>{group.title}</span>
              <span className="admin-sidebar-chevron" aria-hidden />
            </button>

            <ul className="admin-sidebar-sublist">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `admin-sidebar-link${isActive ? ' admin-sidebar-link--active' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </aside>
  )
}
