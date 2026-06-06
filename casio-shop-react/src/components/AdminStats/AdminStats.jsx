import { formatPrice } from '../../utils/format'
import './AdminStats.css'

export default function AdminStats({ stats }) {
  if (!stats) return null

  const cards = [
    { label: 'Tổng doanh thu', value: formatPrice(stats.total_revenue), accent: 'green' },
    { label: 'Đã hoàn tất', value: formatPrice(stats.completed_revenue), accent: 'teal' },
    { label: 'Tổng đơn', value: String(stats.total_orders), accent: 'dark' },
    { label: 'Chờ xử lý', value: String(stats.pending_orders), accent: 'amber' },
    { label: 'Đơn hôm nay', value: String(stats.today_orders), accent: 'blue' },
    { label: 'Doanh thu hôm nay', value: formatPrice(stats.today_revenue), accent: 'green' },
  ]

  return (
    <div className="admin-stats">
      {cards.map((card) => (
        <div key={card.label} className={`admin-stats-card admin-stats-card--${card.accent}`}>
          <span className="admin-stats-label">{card.label}</span>
          <strong className="admin-stats-value">{card.value}</strong>
        </div>
      ))}
    </div>
  )
}
