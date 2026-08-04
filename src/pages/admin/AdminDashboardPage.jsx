import {
  adminSummary,
  orderStatusBreakdown,
  salesOverview,
  stockOverview,
  topSellingItems,
} from '../../data/systemData'

function SalesLineChart({ data }) {
  const width = 520
  const height = 220
  const pad = 28
  const max = Math.max(...data.map((d) => d.value), 50)
  const points = data.map((d, i) => {
    const x = pad + (i * (width - pad * 2)) / (data.length - 1)
    const y = height - pad - (d.value / max) * (height - pad * 2)
    return `${x},${y}`
  })
  const area = `${pad},${height - pad} ${points.join(' ')} ${width - pad},${height - pad}`

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sales overview">
      {[0, 10, 20, 30, 40, 50].map((tick) => {
        const y = height - pad - (tick / 50) * (height - pad * 2)
        return (
          <g key={tick}>
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
        const x = pad + (i * (width - pad * 2)) / (data.length - 1)
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

  return (
    <div className="donut-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
        <g transform="rotate(-90 80 80)">
          {items.map((item) => {
            const len = (item.value / total) * c
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
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#064e3b">
          {total}
        </text>
        <text x="80" y="96" textAnchor="middle" fontSize="11" fill="#64748b">
          Total Orders
        </text>
      </svg>
      <ul className="donut-legend">
        {items.map((item) => (
          <li key={item.label}>
            <span style={{ background: item.color }} />
            <strong>{item.label}</strong>
            <em>
              {item.value} ({item.percent}%)
            </em>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AdminDashboardPage() {
  return (
    <section className="dashboard-page">
      <div className="stats-grid">
        <article className="stat-card">
          <div>
            <h3>ORDERS</h3>
            <p>{adminSummary.orders}</p>
            <small>Number of Orders</small>
          </div>
          <span className="stat-icon cart" />
        </article>
        <article className="stat-card">
          <div>
            <h3>DELIVERED</h3>
            <p>{adminSummary.delivered}</p>
            <small>Delivered Items</small>
          </div>
          <span className="stat-icon truck" />
        </article>
        <article className="stat-card">
          <div>
            <h3>COSTUMERS</h3>
            <p>{adminSummary.customers}</p>
            <small>Number of Costumers</small>
          </div>
          <span className="stat-icon users" />
        </article>
      </div>

      <div className="admin-panels">
        <article className="panel-card">
          <div className="panel-head">
            <h3>Sales Overview</h3>
            <select defaultValue="monthly" aria-label="Sales range">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <SalesLineChart data={salesOverview} />
        </article>

        <article className="panel-card">
          <h3>Order Status</h3>
          <DonutChart items={orderStatusBreakdown} total={56} />
        </article>

        <article className="panel-card">
          <h3>Top Selling Items</h3>
          <div className="selling-table">
            <div className="selling-head">
              <span>Product</span>
              <span>Sold</span>
            </div>
            {topSellingItems.map((item) => (
              <div className="selling-row" key={item.name}>
                <div>
                  <img src={item.image} alt="" />
                  <span>{item.name}</span>
                </div>
                <strong>{item.sold}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <h3>Stock Overview</h3>
          <ul className="stock-list">
            {stockOverview.map((item) => (
              <li key={item.label}>
                <div>
                  <span className={`stock-icon ${item.tone}`} />
                  <strong>{item.label}</strong>
                </div>
                <button type="button" className="text-view">
                  View
                </button>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}

export default AdminDashboardPage
