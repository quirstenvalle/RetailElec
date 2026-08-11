import { useEffect, useMemo, useState } from 'react'
import { assets } from '../../constants/assets'

const PAGE_SIZE = 5

function formatLastTransaction(value) {
  if (!value || value === 'No transaction yet') return value || 'No transaction yet'
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed)
  }
  return value
}

function CustomerFormModal({ title, initial, error, saving, onClose, onSubmit }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal-card customer-form-modal"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        <div className="field">
          <label htmlFor="customer-name">Full name</label>
          <input
            id="customer-name"
            name="name"
            required
            defaultValue={initial?.name || ''}
            placeholder="Juan Dela Cruz"
          />
        </div>
        <div className="field">
          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            name="email"
            type="email"
            required
            defaultValue={initial?.email || ''}
            placeholder="customer@business.com"
          />
        </div>
        <div className="field">
          <label htmlFor="customer-phone">Phone number</label>
          <input
            id="customer-phone"
            name="phone"
            required
            defaultValue={initial?.phone || ''}
            placeholder="09XX XXX XXXX"
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-green" disabled={saving}>
            {saving ? 'Saving…' : title === 'Edit Customer' ? 'Save Changes' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminCustomersPage({ customers, onAddCustomer, onUpdateCustomer }) {
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [activityFilter, setActivityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [modalMode, setModalMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPage(0)
  }, [query, activityFilter])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesQuery =
        !needle ||
        customer.name.toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle) ||
        String(customer.phone || '').toLowerCase().includes(needle)

      const hasTxn = customer.lastTransaction && customer.lastTransaction !== 'No transaction yet'
      const matchesActivity =
        activityFilter === 'all' ||
        (activityFilter === 'with_txn' && hasTxn) ||
        (activityFilter === 'no_txn' && !hasTxn)

      return matchesQuery && matchesActivity
    })
  }, [activityFilter, customers, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
    setError('')
    setSaving(false)
  }

  const openAdd = () => {
    setEditing(null)
    setError('')
    setModalMode('add')
  }

  const openEdit = (customer) => {
    setEditing(customer)
    setError('')
    setModalMode('edit')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const phone = String(formData.get('phone') || '').trim()

    if (!name || !email || !phone) {
      setError('Please fill in all customer fields.')
      return
    }

    const emailTaken = customers.some(
      (customer) => customer.email === email && customer.id !== editing?.id,
    )
    if (emailTaken) {
      setError('A customer with this email already exists.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (modalMode === 'edit' && editing) {
        await onUpdateCustomer(editing.id, { name, email, phone })
      } else {
        await onAddCustomer({ name, email, phone })
      }
      closeModal()
    } catch (err) {
      setError(err.message || 'Could not save customer')
      setSaving(false)
    }
  }

  return (
    <section className="admin-page customers-page">
      <div className="admin-toolbar customers-toolbar">
        <div className="customers-tools">
          <div className="customer-search">
            <img src={assets.iconSearch} alt="" />
            <input
              className="filter-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter customer name or email"
            />
          </div>
          <div className="customer-filter-wrap">
            <button
              type="button"
              className={`btn-ghost filter-btn${filterOpen || activityFilter !== 'all' ? ' active' : ''}`}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 6h16M7 12h10M10 18h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Filter
            </button>
            {filterOpen ? (
              <div className="customer-filter-panel">
                <p>Activity</p>
                <label>
                  <input
                    type="radio"
                    name="activity"
                    checked={activityFilter === 'all'}
                    onChange={() => setActivityFilter('all')}
                  />
                  All customers
                </label>
                <label>
                  <input
                    type="radio"
                    name="activity"
                    checked={activityFilter === 'with_txn'}
                    onChange={() => setActivityFilter('with_txn')}
                  />
                  With transactions
                </label>
                <label>
                  <input
                    type="radio"
                    name="activity"
                    checked={activityFilter === 'no_txn'}
                    onChange={() => setActivityFilter('no_txn')}
                  />
                  No transactions yet
                </label>
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" className="btn-green" onClick={openAdd}>
          Add Customer +
        </button>
      </div>

      <div className="admin-table-card customers-table-card">
        <div className="admin-table customers-table">
          <div className="admin-row head customers-row">
            <span>Name</span>
            <span>Email</span>
            <span>Phone Number</span>
            <span>Last Transaction</span>
            <span>Action</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">No customers match your search.</div>
          ) : (
            paged.map((customer) => (
              <div className="admin-row customers-row" key={customer.id}>
                <span className="customer-name">{customer.name}</span>
                <span>{customer.email}</span>
                <span>{customer.phone}</span>
                <span>{formatLastTransaction(customer.lastTransaction)}</span>
                <span>
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Edit ${customer.name}`}
                    title="Edit customer"
                    onClick={() => openEdit(customer)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="table-footer customers-pagination">
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="orders-pagination__btns">
            <button
              type="button"
              className="btn-ghost"
              disabled={safePage <= 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-green next-btn"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalMode ? (
        <CustomerFormModal
          title={modalMode === 'edit' ? 'Edit Customer' : 'Add Customer'}
          initial={editing}
          error={error}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </section>
  )
}

export default AdminCustomersPage
