import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchMyOrderDetails, fetchMyOrders } from '../../api/ordersApi'
import { toCurrency } from '../../utils/formatters'
import { getOrderStatusBlurb, getOrderTrackingSteps } from '../../utils/orderTracking'

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function formatOrderDate(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed)
  }
  return value
}

function statusClass(status) {
  return `status-tag soft ${(status || '').toLowerCase()}`
}

function OrderTrackingPanel({ order }) {
  const isPickup = order.deliveryMode === 'pickup'
  const steps = getOrderTrackingSteps(order)

  return (
    <article className="customer-order-panel">
      <h3>Tracking</h3>
      <p className="customer-order-blurb">{getOrderStatusBlurb(order)}</p>

      {order.status === 'Cancelled' ? (
        <div className="cancel-reason-box">
          <p className="order-tracking-cancelled">This order was cancelled.</p>
          {order.cancellationReason ? (
            <p>
              <strong>Reason:</strong> {order.cancellationReason}
            </p>
          ) : null}
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
        {!isPickup && order.shippingCarrier ? (
          <div>
            <dt>Carrier</dt>
            <dd>{order.shippingCarrier}</dd>
          </div>
        ) : null}
        {!isPickup && order.trackingNumber ? (
          <div>
            <dt>Tracking no.</dt>
            <dd className="order-tracking-number">{order.trackingNumber}</dd>
          </div>
        ) : null}
        {!isPickup && order.shippedAt ? (
          <div>
            <dt>Shipped on</dt>
            <dd>{order.shippedAt}</dd>
          </div>
        ) : null}
        {isPickup ? (
          <div>
            <dt>Pickup location</dt>
            <dd>MarketBulk Central Hub, Cavite</dd>
          </div>
        ) : null}
        {!isPickup && (order.shippingAddress || order.shippingCity) ? (
          <div>
            <dt>Ship to</dt>
            <dd>
              {[order.shippingAddress, order.shippingCity, order.shippingProvince, order.shippingPostalCode]
                .filter(Boolean)
                .join(', ')}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}

function CustomerOrderDetail({ orderId, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchMyOrderDetails(orderId)
        if (active) setDetail(data)
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

  if (loading) {
    return (
      <section className="customer-orders-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="settings-loading">Loading order…</p>
      </section>
    )
  }

  if (error || !detail) {
    return (
      <section className="customer-orders-page">
        <button type="button" className="order-back" onClick={onBack}>
          ← Back to Orders
        </button>
        <p className="form-error">{error || 'Order not found'}</p>
      </section>
    )
  }

  const isPickup = detail.deliveryMode === 'pickup'

  return (
    <section className="customer-orders-page">
      <button type="button" className="order-back" onClick={onBack}>
        ← Back to Orders
      </button>

      <div className="customer-order-detail-head">
        <div>
          <h2>{detail.id}</h2>
          <p>
            Placed {formatOrderDate(detail.orderDate)} ·{' '}
            <span className={statusClass(detail.status)}>{detail.status}</span>
            {isPickup ? <span className="status-tag soft">Self-pickup</span> : null}
          </p>
        </div>
        <strong className="customer-order-total">{toCurrency(detail.total)}</strong>
      </div>

      <div className="customer-order-detail-grid">
        <div className="customer-order-detail-main">
          <article className="customer-order-panel">
            <h3>Items</h3>
            <div className="customer-order-items">
              {detail.items.length === 0 ? (
                <p className="empty-state">No items on this order.</p>
              ) : (
                detail.items.map((item) => (
                  <div className="customer-order-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        Qty {item.quantity} ·{' '}
                        {item.pricingUnit === 'piece'
                          ? 'Per piece'
                          : item.pricingUnit === 'pack'
                            ? 'Per pack'
                            : 'Per box'}
                      </small>
                    </div>
                    <span>{toCurrency(item.lineTotal)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="order-summary-card embedded">
              <div className="order-summary-line">
                <span>Subtotal</span>
                <strong>{toCurrency(detail.subtotal)}</strong>
              </div>
              <div className="order-summary-line">
                <span>{isPickup ? 'Pickup' : 'Shipping'}</span>
                <strong>{toCurrency(detail.shippingFee || Math.max(0, detail.total - detail.subtotal))}</strong>
              </div>
              <div className="order-summary-line total">
                <span>Total</span>
                <strong>{toCurrency(detail.total)}</strong>
              </div>
            </div>
          </article>
        </div>
        <aside className="customer-order-detail-side">
          <OrderTrackingPanel order={detail} />
          <article className="customer-order-panel">
            <h3>Payment</h3>
            <dl className="order-info-list">
              <div>
                <dt>Mode</dt>
                <dd>{detail.paymentMode || '—'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{detail.paymentStatus || 'unpaid'}</dd>
              </div>
              {detail.receiptId ? (
                <div>
                  <dt>Receipt</dt>
                  <dd>{detail.receiptId}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        </aside>
      </div>
    </section>
  )
}

function CustomerOrdersPage() {
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('order')
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await fetchMyOrders())
    } catch (err) {
      setError(err.message || 'Could not load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'All') return orders
    return orders.filter((order) => order.status === filter)
  }, [filter, orders])

  const openOrder = (id) => {
    setParams({ order: id })
  }

  const closeOrder = () => {
    setParams({})
  }

  if (selectedId) {
    return <CustomerOrderDetail orderId={selectedId} onBack={closeOrder} />
  }

  return (
    <section className="customer-orders-page">
      <div className="customer-orders-head">
        <div>
          <h2>My Orders</h2>
          <p>Track purchase orders, pickup readiness, and courier deliveries.</p>
        </div>
        <Link to="/categories" className="btn-green">
          Continue Shopping
        </Link>
      </div>

      <div className="customer-order-filters" role="tablist" aria-label="Filter orders">
        {FILTERS.map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={filter === label}
            className={filter === label ? 'active' : ''}
            onClick={() => setFilter(label)}
          >
            {label}
            <em>
              {label === 'All' ? orders.length : orders.filter((order) => order.status === label).length}
            </em>
          </button>
        ))}
      </div>

      {loading ? <p className="settings-loading">Loading your orders…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!loading && !error && filtered.length === 0 ? (
        <div className="customer-orders-empty">
          <h3>No orders yet</h3>
          <p>When you place a wholesale order, you can track it here.</p>
          <Link to="/cart" className="btn-orange">
            Go to Cart
          </Link>
        </div>
      ) : null}

      <div className="customer-orders-list">
        {filtered.map((order) => {
          const isPickup = order.deliveryMode === 'pickup'
          return (
            <article className="customer-order-card" key={order.id}>
              <div className="customer-order-card__top">
                <div>
                  <button type="button" className="order-id-link" onClick={() => openOrder(order.id)}>
                    {order.id}
                  </button>
                  <p>{formatOrderDate(order.orderDate)}</p>
                </div>
                <span className={statusClass(order.status)}>{order.status}</span>
              </div>

              <p className="customer-order-card__blurb">{getOrderStatusBlurb(order)}</p>

              <div className="customer-order-card__meta">
                <span>{isPickup ? 'Self-pickup' : 'Courier'}</span>
                <span>{order.paymentMode || 'Payment pending'}</span>
                <strong>{toCurrency(order.total)}</strong>
              </div>

              {!isPickup && order.trackingNumber ? (
                <p className="customer-order-card__tracking">
                  Tracking: <span className="order-tracking-number">{order.trackingNumber}</span>
                </p>
              ) : null}

              <div className="customer-order-card__actions">
                <button type="button" className="btn-green" onClick={() => openOrder(order.id)}>
                  Track Order
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CustomerOrdersPage
