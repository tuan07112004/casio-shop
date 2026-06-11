import { useEffect, useState } from 'react'
import { fetchShopVouchers } from '../../api/client'
import { formatPrice } from '../../utils/format'
import { formatVoucherOffer } from '../../utils/voucher'
import './ProductShopVouchers.css'

export default function ProductShopVouchers({ productId }) {
  const [vouchers, setVouchers] = useState([])
  const [saved, setSaved] = useState(() => new Set())

  useEffect(() => {
    fetchShopVouchers(productId).then(setVouchers).catch(() => setVouchers([]))
  }, [productId])

  if (!vouchers.length) return null

  const handleSave = (code) => {
    setSaved((prev) => new Set(prev).add(code))
  }

  return (
    <div className="product-shop-vouchers">
      <span className="product-shop-vouchers-label">Voucher của Shop</span>
      <div className="product-shop-vouchers-track">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="product-shop-voucher-card">
            <div className="product-shop-voucher-main">
              <strong>{formatVoucherOffer(voucher, formatPrice)}</strong>
              <span>Mã: {voucher.code}</span>
            </div>
            <button
              type="button"
              className={`product-shop-voucher-save${saved.has(voucher.code) ? ' product-shop-voucher-save--saved' : ''}`}
              onClick={() => handleSave(voucher.code)}
              disabled={saved.has(voucher.code)}
            >
              {saved.has(voucher.code) ? 'Đã lưu' : 'Lưu'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
