import { getStockInfo } from '../../utils/stock'
import './StockBadge.css'

export default function StockBadge({ stock, className = '' }) {
  const info = getStockInfo(stock)
  if (!info) return null

  return (
    <span className={`stock-badge ${info.className} ${className}`.trim()}>
      {info.text}
    </span>
  )
}
