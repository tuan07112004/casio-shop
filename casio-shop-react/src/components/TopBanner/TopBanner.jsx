import { Link } from 'react-router-dom'
import './TopBanner.css'

export default function TopBanner() {
  return (
    <div className="top-banner">
      <Link
        to="/cua-hang"
        className="top-banner-link"
        aria-label="Khuyến mãi — xem cửa hàng"
      />
    </div>
  )
}
