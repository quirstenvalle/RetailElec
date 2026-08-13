import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchOrderDetails, shipOrder } from '../../api/ordersApi'

const LABELS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const PAGE_SIZE = 6
const CARRIERS = ['Lalamove', 'J&T Express', 'GrabExpress', 'Ninja Van', 'LBC', 'Self Delivery']
const CANCEL_REASONS = [
  'Out of stock',
  'Customer requested cancellation',
  'Payment issue',
  'Invalid or incomplete delivery details',
  'Duplicate order',
  'Other',
]

const money = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

function formatOrderDate(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed)
  }
  return value
}

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function CustomerCard({ detail }) {
  return (
    <article className="order-card">
      <h3>Customer Information</h3>
      <div className="order-customer-hero">
        <div className="order-customer-avatar" aria-hidden="true">
          {initialsFromName(detail.customer)}
        </div>
        <div>
          <strong>{detail.customer || '—'}</strong>
          <span>Wholesale Client</span>
        </div>
      </div>
      <dl className="order-info-list">
        <div>
          <dt>Email</dt>
          <dd>{detail.customerEmail || '—'}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{detail.customerPhone || 'Not set'}</dd>
        </div>
      </dl>
    </article>
  )
}

function LineItemsCard({ detail, shippingLabel }) {
  const shippingFee =
    Number(detail.shippingFee) > 0
      ? Number(detail.shippingFee)
      : Math.max(0, Number(detail.total) - Number(detail.subtotal))
  const displayTotal =
    Number(detail.shippingFee) > 0 ? Number(detail.subtotal) + shippingFee : Number(detail.total)

  return (
    <article className="order-card">
      <div className="admin-table order-items-table">
        <div className="admin-row head order-items-row">
          <span>Product</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Total</span>
        </div>
        {detail.items.length === 0 ? (
          <div className="empty-state">No line items on this order.</div>
        ) : (
                detail.items.map((item) => (
                  <div className="admin-row order-items-row" key={item.id}>
                    <div className="order-product">
                      <strong>{item.name}</strong>
                      <small>
                        SKU: {item.sku} ·{' '}
                        {item.pricingUnit === 'piece'
                          ? 'Per piece'
                          : item.pricingUnit === 'pack'
                            ? 'Per pack'
                            : 'Per box'}
                      </small>
                    </div>
                    <span>{item.quantity}</span>
                    <span>{money(item.unitPrice)}</span>
                    <span>{money(item.lineTotal)}</span>
                  </div>
                ))
        )}
      </div>
      <div className="order-summary-card embedded">
        <div className="order-summary-line">
          <span>Subtotal</span>
          <strong>{money(detail.subtotal)}</strong>
        </div>
        <div className="order-summary-line">
          <span>{shippingLabel || 'Shipping'}</span>
          <strong>{money(shippingFee)}</strong>
        </div>
        <div className="order-summary-line total">
          <span>Total</span>
          <strong>{money(displayTotal)}</strong>
        </div>
      </div>
    </article>
  )
}

function trackingSteps(detail) {
  const isPickup = detail.deliveryMode === 'pickup'
  const status = detail.status
  const cancelled = status === 'Cancelled'
  const rank = { Pending: 0, Processing: 1, Shipped: 2, Delivered: 3, Cancelled: -1 }[status] ?? 0

  return [
    { key: 'Pending', label: 'Order placed' },
    { key: 'Processing', label: 'Processing' },
    {
      key: 'Shipped',
      label: isPickup ? 'Ready for pickup' : 'Shipped',
    },
    {
      key: 'Delivered',
      label: isPickup ? 'Picked up' : 'Delivered',
    },
  ].map((step, index) => ({
    ...step,
    state: cancelled ? 'idle' : index < rank ? 'done' : index === rank ? 'current' : 'idle',
  }))
}

function OrderTrackingCard({ detail }) {
  const isPickup = detail.deliveryMode === 'pickup'
  const steps = trackingSteps(detail)

  return (
    <article className="order-card order-tracking-card">
      <h3>Order Tracking</h3>
      {detail.status === 'Cancelled' ? (
        <div className="cancel-reason-box">
          <p className="order-tracking-cancelled">This order was cancelled.</p>
          {detail.cancellationReason ? (
            <p>
              <strong>Reason:</strong> {detail.cancellationReason}
            </p>
          ) : null}
          {detail.cancelledAt ? <small>Cancelled {formatOrderDate(detail.cancelledAt)}</small> : null}
        </div>
      ) : (
        <ol className="order-track-steps">
          {steps.map((step) => (
            <li key={step.key} className={`order-track-step ${step.state}`}>
              <span className="order-track-dot" aria-hidden="true" />
              <div>
                <strong>{step.label}</strong>
                {step.state === 'current' ? <small>Current status</small> : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      <dl className="order-info-list">
        <div>
          <dt>Delivery</dt>
          <dd>{isPickup ? 'Self-pickup' : 'Courier delivery'}</dd>
        </div>
        {!isPickup && detail.shippingCarrier ? (
          <div>
            <dt>Carrier</dt>
            <dd>{detail.shippingCarrier}</dd>
          </div>
        ) : null}
        {!isPickup && detail.trackingNumber ? (
          <div>
            <dt>Tracking no.</dt>
            <dd className="order-tracking-number">{detail.trackingNumber}</dd>
          </div>
        ) : null}
        {!isPickup && detail.shippedAt ? (
          <div>
            <dt>Shipped on</dt>
            <dd>{detail.shippedAt}</dd>
          </div>
        ) : null}
        {isPickup && detail.status === 'Shipped' ? (
          <div>
            <dt>Pickup desk</dt>
            <dd>Ready at Quinto Store Hub, Cavite</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}

function CancelOrderModal({ orderId, working, error, onClose, onConfirm }) {
  const [preset, setPreset] = useState(CANCEL_REASONS[0])
  const [details, setDetails] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const extra = details.trim()
    const reason =
      preset === 'Other' ? extra : extra ? `${preset}. ${extra}` : preset
    onConfirm(reason)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card cancel-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="cancel-order-title">Cancel order {orderId}</h3>
        <p>Tell the customer why this order is being cancelled.</p>
        <form className="profile-fields" onSubmit={submit}>
          <div className="field">
            <label htmlFor="cancelReasonPreset">REASON</label>
            <select
              id="cancelReasonPreset"
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
              required
            >
              {CANCEL_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cancelReasonDetails">
              {preset === 'Other' ? 'EXPLAIN WHY (REQUIRED)' : 'ADDITIONAL DETAILS (OPTIONAL)'}
            </label>
            <textarea
              id="cancelReasonDetails"
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={
                preset === 'Other'
                  ? 'Write the cancellation reason for the customer…'
                  : 'Optional note the customer will see…'
              }
              required={preset === 'Other'}
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn-ghost" disabled={working} onClick={onClose}>
              Keep Order
            </button>
            <button type="submit" className="btn-orange" disabled={working}>
              {working ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OrderDetailView({ orderId, onBack, onUpdateStatus, onCancelOrder, onShip }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setDetail(await fetchOrderDetails(orderId))
    } catch (err) {
      setError(err.message || 'Could not load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [orderId])

  const runStatus = async (status) => {
    setWorking(true)
    setError('')
    try {
      await onUpdateStatus(orderId, status)
      await load()
    } catch (err) {
      setError(err.message || 'Could not update order')
    } finally {
      setWorking(false)
    }
  }

  const confirmCancel = async (reason) => {
    setWorking(true)
    setCancelError('')
    try {
      await onCancelOrder(orderId, reason)
      setShowCancelModal(false)
      await load()
    } catch (err) {
      setCancelError(err.message || 'Could not cancel order')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <section className="order-detail-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="settings-loading">Loading order…</p>
      </section>
    )
  }

  if (error && !detail) {
    return (
      <section className="order-detail-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="form-error">{error}</p>
      </section>
    )
  }

  const isPickup = detail.deliveryMode === 'pickup'
  const canCancel = detail.status !== 'Cancelled' && detail.status !== 'Delivered'
  const shippingLabel = isPickup
    ? 'Pickup'
    : detail.shippingCarrier
      ? `Shipping (${detail.shippingCarrier})`
      : 'Shipping / fees'

  return (
    <section className="order-detail-page">
      <button type="button" className="order-back" onClick={onBack}>
        ← Back to Orders
      </button>

      <div className="order-detail-head">
        <div>
          <h2>{detail.id}</h2>
          <p>
            Placed {formatOrderDate(detail.orderDate)} ·{' '}
            <span className={`status-tag soft ${detail.status.toLowerCase()}`}>{detail.status}</span>
            {isPickup ? <span className="status-tag soft">Self-pickup</span> : null}
          </p>
        </div>
        <div className="order-detail-actions">
          {canCancel ? (
            <button
              type="button"
              className="btn-ghost order-cancel-btn"
              disabled={working}
              onClick={() => {
                setCancelError('')
                setShowCancelModal(true)
              }}
            >
              Cancel Order
            </button>
          ) : null}
          {detail.status === 'Pending' ? (
            <button type="button" className="btn-green" disabled={working} onClick={() => runStatus('Processing')}>
              {working ? 'Updating…' : 'Process Order'}
            </button>
          ) : null}
          {detail.status === 'Processing' && isPickup ? (
            <button type="button" className="btn-green" disabled={working} onClick={() => runStatus('Shipped')}>
              {working ? 'Updating…' : 'Ready for Pickup'}
            </button>
          ) : null}
          {detail.status === 'Processing' && !isPickup ? (
            <button type="button" className="btn-green" disabled={working} onClick={() => onShip(orderId)}>
              Ship Order
            </button>
          ) : null}
          {detail.status === 'Shipped' ? (
            <button type="button" className="btn-green" disabled={working} onClick={() => runStatus('Delivered')}>
              {working ? 'Updating…' : isPickup ? 'Mark Picked Up' : 'Mark Delivered'}
            </button>
          ) : null}
          {detail.status === 'Cancelled' ? (
            <button type="button" className="btn-green" disabled={working} onClick={() => runStatus('Pending')}>
              Reopen as Pending
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <LineItemsCard detail={detail} shippingLabel={shippingLabel} />
        </div>
        <aside className="order-detail-side">
          <CustomerCard detail={detail} />
          <article className="order-card">
            <h3>{detail.deliveryMode === 'pickup' ? 'Pickup' : 'Shipping Address'}</h3>
            <dl className="order-info-list">
              {detail.deliveryMode === 'pickup' ? (
                <div>
                  <dt>Location</dt>
                  <dd>Quinto Store Hub, Cavite</dd>
                </div>
              ) : (
                <>
                  <div>
                    <dt>Street</dt>
                    <dd>{detail.shippingAddress || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt>City</dt>
                    <dd>{detail.shippingCity || '—'}</dd>
                  </div>
                  <div>
                    <dt>Province</dt>
                    <dd>{detail.shippingProvince || '—'}</dd>
                  </div>
                  <div>
                    <dt>Postal code</dt>
                    <dd>{detail.shippingPostalCode || '—'}</dd>
                  </div>
                </>
              )}
            </dl>
          </article>

          <article className="order-card">
            <h3>Delivery & Payment</h3>
            <dl className="order-info-list">
              <div>
                <dt>Delivery mode</dt>
                <dd>{isPickup ? 'Self-pickup' : 'Courier'}</dd>
              </div>
              <div>
                <dt>Payment mode</dt>
                <dd>{detail.paymentMode || 'Not set'}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>{detail.paymentStatus || 'unpaid'}</dd>
              </div>
            </dl>
          </article>
          <OrderTrackingCard detail={detail} />
        </aside>
      </div>

      {showCancelModal ? (
        <CancelOrderModal
          orderId={detail.id}
          working={working}
          error={cancelError}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancel}
        />
      ) : null}
    </section>
  )
}

function ShipOrderView({ orderId, onBack, onShipped }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [carrier, setCarrier] = useState('Lalamove')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippedAt, setShippedAt] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchOrderDetails(orderId)
        if (!active) return
        setDetail(data)
        if (data.shippingCarrier) setCarrier(data.shippingCarrier)
        if (data.trackingNumber) setTrackingNumber(data.trackingNumber)
        if (data.shippedAt) setShippedAt(data.shippedAt)
      } catch (err) {
        if (active) setError(err.message || 'Could not load order')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [orderId])

  const confirmShipment = async () => {
    setWorking(true)
    setError('')
    try {
      const updated = await shipOrder(orderId, {
        carrier,
        trackingNumber,
        shippedAt,
        shippingFee: detail?.shippingFee || 0,
      })
      onShipped(updated)
    } catch (err) {
      setError(err.message || 'Could not confirm shipment')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <section className="order-detail-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="settings-loading">Loading shipment…</p>
      </section>
    )
  }

  if (!detail) {
    return (
      <section className="order-detail-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="form-error">{error || 'Order not found'}</p>
      </section>
    )
  }

  return (
    <section className="order-detail-page">
      <button type="button" className="order-back" onClick={onBack}>
        ← Back to Orders
      </button>

      <div className="order-detail-head">
        <div>
          <h2>Ship Order: {detail.id}</h2>
          <p>Enter carrier and tracking details before confirming shipment.</p>
        </div>
        <div className="order-detail-actions">
          <button type="button" className="btn-ghost order-cancel-btn" disabled={working} onClick={onBack}>
            Cancel
          </button>
          <button type="button" className="btn-green ship-confirm-btn" disabled={working} onClick={confirmShipment}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="18" r="1.5" fill="currentColor" />
              <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
            </svg>
            {working ? 'Confirming…' : 'Confirm Shipment'}
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <LineItemsCard detail={detail} shippingLabel={`Shipping (${carrier})`} />
        </div>
        <aside className="order-detail-side">
          <CustomerCard detail={detail} />
          <article className="order-card">
            <h3>Shipment Details</h3>
            <div className="profile-fields">
              <div className="field">
                <label htmlFor="shipCarrier">SHIPPING CARRIER</label>
                <select id="shipCarrier" value={carrier} onChange={(event) => setCarrier(event.target.value)}>
                  {CARRIERS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="shipTracking">TRACKING NUMBER</label>
                <input
                  id="shipTracking"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Enter tracking number"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="shipDate">SHIPMENT DATE</label>
                <input
                  id="shipDate"
                  type="date"
                  value={shippedAt}
                  onChange={(event) => setShippedAt(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="shipment-note">
              Ensure tracking number is accurate before confirming shipment. An automated notification will be
              sent to the customer.
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}

function OrderRowMenu({
  order,
  openUp = false,
  onView,
  onProcess,
  onShip,
  onReadyPickup,
  onDeliver,
  onCancel,
  onReopen,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const isPickup = order.deliveryMode === 'pickup'

  useEffect(() => {
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className={`row-actions${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="row-menu"
        aria-label="Order actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⋮
      </button>
      {open ? (
        <div className={`row-menu-panel${openUp ? ' open-up' : ''}`} role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onView()
            }}
          >
            View Order
          </button>
          {order.status === 'Pending' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onProcess()
              }}
            >
              Process Order
            </button>
          ) : null}
          {order.status === 'Processing' && isPickup ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onReadyPickup()
              }}
            >
              Ready for Pickup
            </button>
          ) : null}
          {order.status === 'Processing' && !isPickup ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onShip()
              }}
            >
              Ship Order
            </button>
          ) : null}
          {order.status === 'Shipped' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onDeliver()
              }}
            >
              {isPickup ? 'Mark Picked Up' : 'Mark Delivered'}
            </button>
          ) : null}
          {order.status !== 'Cancelled' && order.status !== 'Delivered' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onCancel()
              }}
            >
              Cancel Order
            </button>
          ) : null}
          {order.status === 'Cancelled' ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onReopen()
              }}
            >
              Reopen as Pending
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function AdminOrdersPage({ orders, onUpdateStatus, onCancelOrder, onOrderShipped }) {
  const [activeStatus, setActiveStatus] = useState('Pending')
  const [page, setPage] = useState(0)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [shipOrderId, setShipOrderId] = useState(null)
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [cancelWorking, setCancelWorking] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const counts = useMemo(() => {
    return Object.fromEntries(LABELS.map((label) => [label, orders.filter((order) => order.status === label).length]))
  }, [orders])

  const filtered = useMemo(
    () => orders.filter((order) => order.status === activeStatus),
    [activeStatus, orders],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const handleStatus = async (id, status) => {
    await onUpdateStatus(id, status)
    setActiveStatus(status)
  }

  const confirmCancel = async (reason) => {
    setCancelWorking(true)
    setCancelError('')
    try {
      await onCancelOrder(cancelOrderId, reason)
      setCancelOrderId(null)
      setActiveStatus('Cancelled')
    } catch (err) {
      setCancelError(err.message || 'Could not cancel order')
    } finally {
      setCancelWorking(false)
    }
  }

  if (shipOrderId) {
    return (
      <ShipOrderView
        orderId={shipOrderId}
        onBack={() => setShipOrderId(null)}
        onShipped={(updated) => {
          onOrderShipped?.(updated)
          setShipOrderId(null)
          setSelectedOrderId(updated.id)
          setActiveStatus('Shipped')
        }}
      />
    )
  }

  if (selectedOrderId) {
    return (
      <OrderDetailView
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
        onUpdateStatus={handleStatus}
        onCancelOrder={onCancelOrder}
        onShip={(id) => {
          setSelectedOrderId(null)
          setShipOrderId(id)
        }}
      />
    )
  }

  return (
    <section className="admin-page orders-manage-page">
      <div className="admin-table-card orders-manage-card">
        <div className="order-status-tabs" role="tablist" aria-label="Order status">
          {LABELS.map((label) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={activeStatus === label}
              className={activeStatus === label ? 'active' : ''}
              onClick={() => {
                setActiveStatus(label)
                setPage(0)
              }}
            >
              {label} <em>{counts[label]}</em>
            </button>
          ))}
        </div>

        <div className="admin-table orders-manage-table">
          <div className="admin-row head orders-manage-row">
            <span>Order ID</span>
            <span>Date</span>
            <span>Customer</span>
            <span>Total of Order</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {paged.map((order, index) => (
            <div className="admin-row orders-manage-row" key={order.id}>
              <button type="button" className="order-id-link" onClick={() => setSelectedOrderId(order.id)}>
                {order.id}
              </button>
              <span>{formatOrderDate(order.orderDate)}</span>
              <span>{order.customer}</span>
              <span>{money(order.total)}</span>
              <span>
                <small className={`status-tag soft ${order.status.toLowerCase()}`}>{order.status}</small>
              </span>
              <OrderRowMenu
                order={order}
                openUp={index >= Math.max(0, paged.length - 2)}
                onView={() => setSelectedOrderId(order.id)}
                onProcess={() => handleStatus(order.id, 'Processing')}
                onShip={() => setShipOrderId(order.id)}
                onReadyPickup={() => handleStatus(order.id, 'Shipped')}
                onDeliver={() => handleStatus(order.id, 'Delivered')}
                onCancel={() => {
                  setCancelError('')
                  setCancelOrderId(order.id)
                }}
                onReopen={() => handleStatus(order.id, 'Pending')}
              />
            </div>
          ))}

          {filtered.length === 0 ? <div className="empty-state">No orders in this status.</div> : null}
        </div>

        <div className="table-footer orders-pagination">
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

      {cancelOrderId ? (
        <CancelOrderModal
          orderId={cancelOrderId}
          working={cancelWorking}
          error={cancelError}
          onClose={() => setCancelOrderId(null)}
          onConfirm={confirmCancel}
        />
      ) : null}
    </section>
  )
}

export default AdminOrdersPage
