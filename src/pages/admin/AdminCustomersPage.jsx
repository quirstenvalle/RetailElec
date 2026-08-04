import { useMemo, useState } from 'react'
import { assets } from '../../constants/assets'

function AdminCustomersPage({ customers }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return customers
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle),
    )
  }, [customers, query])

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <div className="customers-tools">
          <div className="customer-search">
            <input
              className="filter-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter customer name or email"
            />
            <img src={assets.iconSearch} alt="" />
          </div>
          <button type="button" className="btn-ghost filter-btn">
            Filter
          </button>
        </div>
        <button type="button" className="btn-green">
          Add Customer +
        </button>
      </div>

      <div className="admin-table-card">
        <div className="admin-table">
          <div className="admin-row head">
            <span>NAME</span>
            <span>EMAIL</span>
            <span>PHONE NUMBER</span>
            <span>LAST TRANSACTION</span>
            <span>ACTION</span>
          </div>
          {(filtered.length ? filtered : Array.from({ length: 6 })).map((customer, index) => (
            <div className="admin-row" key={customer?.id || `empty-${index}`}>
              <span>{customer?.name || ''}</span>
              <span>{customer?.email || ''}</span>
              <span>{customer?.phone || ''}</span>
              <span>{customer?.lastTransaction || ''}</span>
              <span className="row-menu">⋮</span>
            </div>
          ))}
        </div>
        <div className="table-footer">
          <button type="button" className="btn-green next-btn">
            NEXT
          </button>
        </div>
      </div>
    </section>
  )
}

export default AdminCustomersPage
