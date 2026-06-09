import { Link } from 'react-router-dom'
import './HeaderSalePromo.css'

const SALE_IMAGE = '/images/promo/sale.png'

export default function HeaderSalePromo() {
  return (
    <Link
      to="/cua-hang"
      className="header-sale-promo"
      aria-label="Xem tất cả sản phẩm"
    >
      <img
        className="header-sale-promo-img"
        src={SALE_IMAGE}
        alt=""
        draggable={false}
      />
    </Link>
  )
}
