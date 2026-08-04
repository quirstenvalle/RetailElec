import { useMemo, useState } from 'react'
import { assets } from '../../constants/assets'

function AdminCustomersPage({ customers, onAddCustomer }) {
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return customers
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle),
    )
  }, [customers, query])

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const phone = String(formData.get('phone') || '').trim()

    if (!name || !email || !phone) {
      setError('Please fill in all customer fields.')
      return
    }

    if (customers.some((customer) => customer.email === email)) {
      setError('A customer with this email already exists.')
      return
    }

    onAddCustomer({ name, email, phone })
    setError('')
    setShowModal(false)
    event.currentTarget.reset()
  }

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
        <button type="button" className="btn-green" onClick={() => setShowModal(true)}>
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
          {filtered.length === 0 ? (
            <div className="empty-state">No customers match your search.</div>
          ) : (
            filtered.map((customer) => (
              <div className="admin-row" key={customer.id}>
                <span>{customer.name}</span>
                <span>{customer.email}</span>
                <span>{customer.phone}</span>
                <span>{customer.lastTransaction}</span>
                <span className="row-actions">
                  <button
                    type="button"
                    className="row-menu"
                    aria-label="Customer actions"
                    onClick={() =>
                      setMenuOpenId((current) => (current === customer.id ? null : customer.id))
                    }
                  >
                    ⋮
                  </button>
                  {menuOpenId === customer.id ? (
                    <div className="row-menu-panel">
                      <button type="button" onClick={() => setMenuOpenId(null)}>
                        View details
                      </button>
                      <a href={`mailto:${customer.email}`} onClick={() => setMenuOpenId(null)}>
                        Email customer
                      </a>
                    </div>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="table-footer">
          <button type="button" className="btn-green next-btn" disabled>
            NEXT
          </button>
        </div>
      </div>

      {showModal ? (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form
            className="modal-card"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Add Customer</h2>
            <div className="field">
              <label htmlFor="customer-name">Full name</label>
              <input id="customer-name" name="name" required placeholder="Juan Dela Cruz" />
            </div>
            <div className="field">
              <label htmlFor="customer-email">Email</label>
              <input
                id="customer-email"
                name="email"
                type="email"
                required
                placeholder="customer@business.com"
              />
            </div>
            <div className="field">
              <label htmlFor="customer-phone">Phone number</label>
              <input
                id="customer-phone"
                name="phone"
                required
                placeholder="09XX XXX XXXX"
              />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-green">
                Save Customer
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default AdminCustomersPage
