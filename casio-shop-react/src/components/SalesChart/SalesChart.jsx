import './SalesChart.css'

const W = 520
const H = 220
const PAD = { top: 20, right: 16, bottom: 32, left: 48 }

function formatRevenueAxis(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

function formatRevenueShort(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1000) return `${Math.round(value / 1000)}K`
  return String(value)
}

export default function SalesChart({ data = [], legendLabel = 'Hôm nay' }) {
  if (!data.length) {
    return <p className="sales-chart-empty">Chưa có dữ liệu doanh số hôm nay.</p>
  }

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const revenue = data.map((d) => d.revenue)
  const maxRevenue = Math.max(...revenue, 1)

  const xs = data.map((_, i) => {
    if (data.length === 1) return PAD.left + plotW / 2
    return PAD.left + (i / (data.length - 1)) * plotW
  })

  const ys = revenue.map(
    (v) => PAD.top + plotH - (v / maxRevenue) * plotH,
  )

  const linePath = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(' ')

  const baseY = PAD.top + plotH
  const areaPath = `${linePath} L ${xs[xs.length - 1].toFixed(1)} ${baseY} L ${xs[0].toFixed(1)} ${baseY} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD.top + plotH - t * plotH,
    label: formatRevenueAxis(Math.round(maxRevenue * t)),
  }))

  return (
    <div className="sales-chart sales-chart--single">
      <div className="sales-chart-legend">
        <span className="sales-chart-legend-item sales-chart-legend-item--today">
          {legendLabel}
        </span>
      </div>

      <svg
        className="sales-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Biểu đồ doanh số hôm nay"
      >
        <defs>
          <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ee4d2d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ee4d2d" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + plotH - t * plotH
          return (
            <line
              key={t}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              className="sales-chart-grid"
            />
          )
        })}

        {yTicks.map((tick) => (
          <text
            key={`y-${tick.label}`}
            x={PAD.left - 6}
            y={tick.y + 4}
            className="sales-chart-axis"
            textAnchor="end"
          >
            {tick.label}
          </text>
        ))}

        <path d={areaPath} className="sales-chart-area" fill="url(#salesAreaGradient)" />
        <path d={linePath} className="sales-chart-line" />

        {data.map((point, i) => (
          <g key={point.label ?? i}>
            <circle cx={xs[i]} cy={ys[i]} r="3.5" className="sales-chart-dot">
              <title>
                {point.label}h: {point.revenue.toLocaleString('vi-VN')} ₫
              </title>
            </circle>
            <text
              x={xs[i]}
              y={H - 8}
              className="sales-chart-x-label"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export { formatRevenueShort }
