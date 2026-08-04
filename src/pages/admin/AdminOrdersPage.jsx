import { useMemo, useState } from 'react'

const labels = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const nextStatus = {
  Pending: 'Processing',
  Processing: 'Shipped',
  Shipped: 'Delivered',
}

function AdminOrdersPage({ orders, onUpdateStatus }) {
  const [activeStatus, setActiveStatus] = useState('Pending')
  const [menuOpenId, setMenuOpenId] = useState(null)

  const filtered = useMemo(
    () => orders.filter((order) => order.status === activeStatus),
    [activeStatus, orders],
  )

  const advanceStatus = (order) => {
    const next = nextStatus[order.status]
    if (!next) return
    onUpdateStatus(order.id, next)
    setMenuOpenId(null)
    if (activeStatus !== next) {
      setActiveStatus(next)
    }
  }

  return (
    <section className="admin-page">
      <div className="status-row">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            className={`status-pill ${label.toLowerCase()}${activeStatus === label ? ' active' : ''}`}
            onClick={() => {
              setActiveStatus(label)
              setMenuOpenId(null)
            }}
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
              <span className="row-actions">
                <button
                  type="button"
                  className="row-menu"
                  aria-label="Order actions"
                  onClick={() =>
                    setMenuOpenId((current) => (current === order.id ? null : order.id))
                  }
                >
                  ⋮
                </button>
                {menuOpenId === order.id ? (
                  <div className="row-menu-panel">
                    {nextStatus[order.status] ? (
                      <button type="button" onClick={() => advanceStatus(order)}>
                        Mark {nextStatus[order.status]}
                      </button>
                    ) : null}
                    {order.status !== 'Cancelled' && order.status !== 'Delivered' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStatus(order.id, 'Cancelled')
                          setMenuOpenId(null)
                          setActiveStatus('Cancelled')
                        }}
                      >
                        Cancel order
                      </button>
                    ) : null}
                    {order.status === 'Cancelled' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStatus(order.id, 'Pending')
                          setMenuOpenId(null)
                          setActiveStatus('Pending')
                        }}
                      >
                        Reopen as Pending
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </span>
            </div>
          ))}
          {filtered.length === 0 ? <div className="empty-state">No orders in this status.</div> : null}
        </div>
        <div className="table-footer">
          <button type="button" className="btn-green next-btn" disabled>
            NEXT
          </button>
        </div>
      </div>
    </section>
  )
}

export default AdminOrdersPage
