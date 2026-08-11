import { useMemo } from 'react'
import { Link } from 'react-router-dom'

const statusColors = {
  Pending: '#f97316',
  Processing: '#38bdf8',
  Shipped: '#86efac',
  Delivered: '#166534',
  Cancelled: '#ef4444',
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function SalesLineChart({ data }) {
  const width = 520
  const height = 220
  const pad = 28
  const max = Math.max(...data.map((d) => d.value), 1)
  const points = data.map((d, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1)
    const y = height - pad - (d.value / max) * (height - pad * 2)
    return `${x},${y}`
  })
  const area = `${pad},${height - pad} ${points.join(' ')} ${width - pad},${height - pad}`

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sales overview">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const tick = Math.round(max * ratio)
        const y = height - pad - ratio * (height - pad * 2)
        return (
          <g key={ratio}>
            <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="#eef2f7" />
            <text x={8} y={y + 4} fontSize="10" fill="#94a3b8">
              {tick}
            </text>
          </g>
        )
      })}
      <polygon points={area} fill="rgba(6,78,59,0.12)" />
      <polyline points={points.join(' ')} fill="none" stroke="#064e3b" strokeWidth="3" />
      {data.map((d, i) => {
        const [x, y] = points[i].split(',')
        return <circle key={d.month} cx={x} cy={y} r="4.5" fill="#064e3b" />
      })}
      {data.map((d, i) => {
        const x = pad + (i * (width - pad * 2)) / Math.max(data.length - 1, 1)
        return (
          <text key={d.month} x={x} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b">
            {d.month}
          </text>
        )
      })}
    </svg>
  )
}

function DonutChart({ items, total }) {
  const radius = 54
  const stroke = 18
  const c = 2 * Math.PI * radius
  let offset = 0
  const safeTotal = total || 1

  return (
    <div className="donut-wrap">
      <div className="donut-ring">
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
          <g transform="rotate(-90 80 80)">
            {total === 0 ? (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={stroke}
              />
            ) : (
              items.map((item) => {
                const len = (item.value / safeTotal) * c
                const el = (
                  <circle
                    key={item.label}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={-offset}
                  />
                )
                offset += len
                return el
              })
            )}
          </g>
        </svg>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <ul className="donut-legend">
        {items.map((item) => (
          <li key={item.label}>
            <span style={{ background: item.color }} />
            <strong>{item.label}</strong>
            <em>{item.value}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminDashboardPage({ orders = [], customersCount = 0, inventory = [] }) {
  const summary = useMemo(() => {
    const delivered = orders.filter((order) => order.status === 'Delivered').length
    return {
      orders: orders.length,
      delivered,
      customers: customersCount,
    }
  }, [customersCount, orders])

  const statusBreakdown = useMemo(() => {
    const labels = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    const total = orders.length || 1
    return labels.map((label) => {
      const value = orders.filter((order) => order.status === label).length
      return {
        label,
        value,
        percent: Math.round((value / total) * 100),
        color: statusColors[label],
      }
    })
  }, [orders])

  const salesOverview = useMemo(() => {
    const counts = Object.fromEntries(monthLabels.map((month) => [month, 0]))
    orders.forEach((order) => {
      const parsed = new Date(order.orderDate)
      if (!Number.isNaN(parsed.getTime())) {
        counts[monthLabels[parsed.getMonth()]] += 1
      }
    })
    return monthLabels.map((month) => ({ month, value: counts[month] }))
  }, [orders])

  const topSellingItems = useMemo(() => {
    return [...inventory]
      .sort((a, b) => Number(b.stock) - Number(a.stock))
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        category: item.category || item.displayCategory || 'General',
        sold: item.stock,
        image: item.image,
      }))
  }, [inventory])

  const stockOverview = useMemo(() => {
    const total = inventory.length || 1
    const inStock = inventory.filter((item) => item.stock > 10).length
    const lowStock = inventory.filter((item) => item.stock > 0 && item.stock <= 10).length
    const outOfStock = inventory.filter((item) => item.stock <= 0).length
    return [
      {
        label: 'In Stock',
        count: inStock,
        percent: Math.round((inStock / total) * 100),
        tone: 'ok',
      },
      {
        label: 'Low Stock',
        count: lowStock,
        percent: Math.round((lowStock / total) * 100),
        tone: 'warn',
      },
      {
        label: 'Out of Stock',
        count: outOfStock,
        percent: Math.round((outOfStock / total) * 100),
        tone: 'danger',
      },
    ]
  }, [inventory])

  return (
    <section className="dashboard-page">
      <div className="stats-grid">
        <article className="stat-card">
          <div>
            <h3>Total Orders</h3>
            <p>{summary.orders}</p>
            <small>Purchase orders received</small>
          </div>
          <span className="stat-icon cart" aria-hidden="true" />
        </article>
        <article className="stat-card">
          <div>
            <h3>Delivered Items</h3>
            <p>{summary.delivered}</p>
            <small>Completed deliveries</small>
          </div>
          <span className="stat-icon truck" aria-hidden="true" />
        </article>
        <article className="stat-card">
          <div>
            <h3>Total Customers</h3>
            <p>{summary.customers}</p>
            <small>Registered merchants</small>
          </div>
          <span className="stat-icon users" aria-hidden="true" />
        </article>
      </div>

      <div className="admin-panels">
        <article className="panel-card">
          <div className="panel-head">
            <h3>Sales Overview</h3>
            <Link to="/admin/report" className="panel-link">
              View Details
            </Link>
          </div>
          <SalesLineChart data={salesOverview} />
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h3>Order Status</h3>
          </div>
          <DonutChart items={statusBreakdown} total={orders.length} />
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h3>Top Selling Items</h3>
            <Link to="/admin/inventory" className="panel-link">
              View Details
            </Link>
          </div>
          <div className="selling-table">
            {topSellingItems.length === 0 ? (
              <div className="empty-state">No products yet. Add inventory to see items here.</div>
            ) : (
              topSellingItems.map((item) => (
                <div className="selling-row" key={item.name}>
                  <div>
                    <img src={item.image} alt="" />
                    <div>
                      <span>{item.name}</span>
                      <small>{item.category}</small>
                    </div>
                  </div>
                  <strong className="sold-count">{item.sold} Stock</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h3>Stock Overview</h3>
            <Link to="/admin/inventory" className="panel-link">
              View Details
            </Link>
          </div>
          <ul className="stock-bars">
            {stockOverview.map((item) => (
              <li key={item.label}>
                <div className="stock-bars__meta">
                  <strong>{item.label}</strong>
                  <span>
                    {item.count} · {item.percent}%
                  </span>
                </div>
                <div className="stock-bars__track">
                  <div className={`stock-bars__fill ${item.tone}`} style={{ width: `${item.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default AdminDashboardPage
