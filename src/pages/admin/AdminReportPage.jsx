import { useMemo, useState } from 'react'
import { toCurrency } from '../../utils/formatters'

function AdminReportPage({ orders = [], inventory = [] }) {
  const [reportType, setReportType] = useState('Sales Summary')
  const [category, setCategory] = useState('all')
  const [generated, setGenerated] = useState(null)

  const categories = useMemo(
    () => [...new Set(inventory.map((item) => item.category))],
    [inventory],
  )

  const handleGenerate = () => {
    if (reportType === 'Inventory Levels') {
      const rows =
        category === 'all'
          ? inventory
          : inventory.filter((item) => item.category === category)
      setGenerated({
        title: 'Inventory Levels',
        rows: rows.map((item) => ({
          a: item.name,
          b: item.category,
          c: String(item.stock),
          d: toCurrency(item.unitPrice),
        })),
        headers: ['Product', 'Category', 'Stock', 'Unit Price'],
      })
      return
    }

    if (reportType === 'Order History') {
      setGenerated({
        title: 'Order History',
        rows: orders.map((order) => ({
          a: order.id,
          b: order.customer,
          c: order.orderDate,
          d: order.status,
        })),
        headers: ['Order ID', 'Customer', 'Date', 'Status'],
      })
      return
    }

    if (reportType === 'Customer Activity') {
      const counts = orders.reduce((acc, order) => {
        acc[order.customer] = (acc[order.customer] || 0) + 1
        return acc
      }, {})
      setGenerated({
        title: 'Customer Activity',
        rows: Object.entries(counts).map(([name, count]) => ({
          a: name,
          b: String(count),
          c: '—',
          d: 'Active',
        })),
        headers: ['Customer', 'Orders', 'Last Seen', 'Status'],
      })
      return
    }

    const pending = orders.filter((order) => order.status === 'Pending').length
    const delivered = orders.filter((order) => order.status === 'Delivered').length
    setGenerated({
      title: 'Sales Summary',
      rows: [
        { a: 'Total Orders', b: String(orders.length), c: '—', d: 'All statuses' },
        { a: 'Pending Orders', b: String(pending), c: '—', d: 'Needs fulfillment' },
        { a: 'Delivered Orders', b: String(delivered), c: '—', d: 'Completed' },
        { a: 'SKU Count', b: String(inventory.length), c: '—', d: 'Active catalog' },
      ],
      headers: ['Metric', 'Value', 'Period', 'Notes'],
    })
  }

  return (
    <section className="report-page">
      <div className="report-card">
        <h2>FILTER OPTIONS</h2>
        <div className="filter-grid">
          <select
            className="filter-input report-filter"
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            <option>Sales Summary</option>
            <option>Inventory Levels</option>
            <option>Order History</option>
            <option>Customer Activity</option>
          </select>
          <input className="filter-input report-filter" type="date" aria-label="Date from" />
          <input className="filter-input report-filter" type="date" aria-label="Date to" />
          <select
            className="filter-input report-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <div className="report-actions">
          <button type="button" className="btn-green" onClick={handleGenerate}>
            GENERATE REPORT
          </button>
        </div>
      </div>

      {generated ? (
        <div className="admin-table-card" style={{ marginTop: 20 }}>
          <h3 style={{ margin: '0 0 12px', color: '#064e3b' }}>{generated.title}</h3>
          <div className="admin-table">
            <div className="admin-row head">
              {generated.headers.map((header) => (
                <span key={header}>{header}</span>
              ))}
            </div>
            {generated.rows.length === 0 ? (
              <div className="empty-state">No records for this report.</div>
            ) : (
              generated.rows.map((row, index) => (
                <div className="admin-row" key={`${row.a}-${index}`}>
                  <span>{row.a}</span>
                  <span>{row.b}</span>
                  <span>{row.c}</span>
                  <span>{row.d}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AdminReportPage
