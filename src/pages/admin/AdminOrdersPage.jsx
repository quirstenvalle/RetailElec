import { useMemo, useState } from 'react'

const labels = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function AdminOrdersPage({ orders }) {
  const [activeStatus, setActiveStatus] = useState('Pending')

  const filtered = useMemo(
    () => orders.filter((order) => order.status === activeStatus),
    [activeStatus, orders],
  )

  return (
    <section className="admin-page">
      <div className="status-row">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            className={`status-pill ${label.toLowerCase()}${activeStatus === label ? ' active' : ''}`}
            onClick={() => setActiveStatus(label)}
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="admin-table-card">
        <div className="admin-table">
          <div className="admin-row head orders-row">
            <span>ORDER ID</span>
            <span>COSTUMER NAME</span>
            <span>ORDER DATE</span>
            <span>STATUS</span>
            <span>ACTION</span>
          </div>
          {filtered.map((order) => (
            <div className="admin-row orders-row" key={order.id}>
              <span>{order.id}</span>
              <span>{order.customer}</span>
              <span>{order.orderDate}</span>
              <span>
                <small className={`status-tag ${order.status.toLowerCase()}`}>{order.status}</small>
              </span>
              <span className="row-menu">⋮</span>
            </div>
          ))}
          {filtered.length === 0 ? <div className="empty-state">No orders in this status.</div> : null}
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

export default AdminOrdersPage
