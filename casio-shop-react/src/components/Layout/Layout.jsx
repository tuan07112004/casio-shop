import { Outlet, useLocation } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import Banner from '../Banner/Banner'
import './Layout.css'
import LogoMarquee from '../LogoMarquee/LogoMarquee'

export default function Layout() {
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
    </div>
  )
}