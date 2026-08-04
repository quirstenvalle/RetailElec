import { useState } from 'react'

function AdminReportPage() {
  const [generated, setGenerated] = useState(false)

  return (
    <section className="report-page">
      <div className="report-card">
        <h2>FILTER OPTIONS</h2>
        <div className="filter-grid">
          <select className="filter-input report-filter" defaultValue="">
            <option value="" disabled>
              Report Type
            </option>
            <option>Sales Summary</option>
            <option>Inventory Levels</option>
            <option>Order History</option>
            <option>Customer Activity</option>
          </select>
          <input className="filter-input report-filter" type="date" aria-label="Date from" />
          <input className="filter-input report-filter" type="date" aria-label="Date to" />
          <select className="filter-input report-filter" defaultValue="all">
            <option value="all">All Categories</option>
            <option>Laundry Care</option>
            <option>Canned Goods</option>
            <option>Dry Materials</option>
          </select>
        </div>
        <div className="report-actions">
          <button type="button" className="btn-green" onClick={() => setGenerated(true)}>
            GENERATE REPORT
          </button>
        </div>
      </div>
      {generated ? (
        <div className="empty-state" style={{ marginTop: 20 }}>
          Report generated successfully.
        </div>
      ) : null}
    </section>
  )
}

export default AdminReportPage
