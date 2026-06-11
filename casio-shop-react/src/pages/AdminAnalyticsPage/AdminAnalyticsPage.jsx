import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetchOrderStats } from '../../api/orders'
import SalesChart, { formatRevenueShort } from '../../components/SalesChart/SalesChart'
import { formatPrice, productImageSrc } from '../../utils/format'
import './AdminAnalyticsPage.css'

const POLL_MS = 15000

function formatTimeRange(now = new Date()) {
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `00:00-${h}:${m} hôm nay (GMT+07)`
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const [refreshing, setRefreshing] = useState(false)

  const loadStats = useCallback(
    async (silent = false) => {
      if (!token) return
      if (!silent) setRefreshing(true)
      try {
        const data = await apiFetchOrderStats(token)
        setStats(data)
        setNow(new Date())
      } catch {
        /* giữ số liệu cũ nếu lỗi mạng */
      } finally {
        if (!silent) setRefreshing(false)
      }
    },
    [token],
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const poll = setInterval(() => loadStats(true), POLL_MS)
    return () => clearInterval(poll)
  }, [loadStats])

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(clock)
  }, [])

  if (!stats) {
    return <p className="admin-analytics-loading">Đang tải phân tích...</p>
  }

  const overview = [
    { label: 'Đơn hàng hôm nay', value: String(stats.today_orders) },
    {
      label: 'Người mua hôm nay',
      value: String(stats.today_unique_buyers ?? 0),
    },
    { label: 'Sản phẩm trong shop', value: String(stats.product_count ?? 0) },
    {
      label: 'Chờ lấy hàng (hôm nay)',
      value: String(stats.today_to_ship_orders ?? 0),
    },
    {
      label: 'Đã xử lý (hôm nay)',
      value: String(stats.today_processed_orders ?? 0),
    },
    {
      label: 'Đơn hủy (hôm nay)',
      value: String(stats.today_cancelled_orders ?? 0),
    },
  ]

  const topProducts = stats.today_top_products || []
  const hourlyData = stats.chart_today_hourly || []

  return (
    <div className="admin-analytics">
      <section className="admin-analytics-hero">
        <p className="admin-analytics-hero-label">Doanh số hôm nay</p>
        <p className="admin-analytics-hero-time">
          {formatTimeRange(now)}
          {refreshing ? ' · Đang cập nhật...' : ''}
        </p>
        <p className="admin-analytics-hero-value">{formatPrice(stats.today_revenue)}</p>
      </section>

      <div className="admin-analytics-grid">
        <section className="admin-analytics-card">
          <h2>Tổng quan hôm nay</h2>
          <div className="admin-analytics-overview">
            {overview.map((item) => (
              <div key={item.label} className="admin-analytics-overview-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-analytics-card admin-analytics-card--chart">
          <h2>Biểu đồ doanh số</h2>
          <SalesChart data={hourlyData} legendLabel="Hôm nay" />
        </section>

        <section className="admin-analytics-card">
          <h2>5 sản phẩm bán chạy hôm nay</h2>
          {topProducts.length === 0 ? (
            <p className="admin-analytics-empty">Chưa có đơn hàng hôm nay.</p>
          ) : (
            <ol className="admin-analytics-top-list">
              {topProducts.map((item, index) => (
                <li key={`${item.name}-${index}`} className="admin-analytics-top-item">
                  <span className="admin-analytics-top-rank">{index + 1}</span>
                  <div className="admin-analytics-top-thumb">
                    {item.image ? (
                      <img src={productImageSrc(item.image)} alt="" />
                    ) : (
                      <span />
                    )}
                  </div>
                  <span className="admin-analytics-top-name">{item.name}</span>
                  <strong className="admin-analytics-top-revenue">
                    ₫ {formatRevenueShort(item.revenue)}
                  </strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
