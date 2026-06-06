import { Outlet, useLocation } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import Banner from '../Banner/Banner'
import './Layout.css'
import LogoMarquee from '../LogoMarquee/LogoMarquee'

export default function Layout() {
  const isHome = useLocation().pathname === '/'

  return (
    <div className="layout">
      <Header />
      {isHome && <Banner />}
      <main className="layout-main">
        <Outlet />
      </main>
      {isHome && <LogoMarquee />}

      <Footer />
    </div>
  )
}