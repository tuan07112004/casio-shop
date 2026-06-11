import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import Banner from '../Banner/Banner'
import './Layout.css'
import LogoMarquee from '../LogoMarquee/LogoMarquee'
import MiniCartDrawer from '../MiniCartDrawer/MiniCartDrawer'
import ProductQuickView from '../ProductQuickView/ProductQuickView'

export default function Layout() {
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isAccount =
    pathname.startsWith('/tai-khoan') || pathname === '/tra-cuu-don'

  return (
    <div className={`layout${isAccount ? ' layout--account' : ''}`}>
      <Header />
      {isHome && <Banner />}
      <main className={`layout-main${isAccount ? ' layout-main--account' : ''}`}>
        <Outlet />
      </main>
      {isHome && <LogoMarquee />}

      {!isAccount && <Footer />}
      {!isAdmin && <MiniCartDrawer />}
      <ProductQuickView />
    </div>
  )
}