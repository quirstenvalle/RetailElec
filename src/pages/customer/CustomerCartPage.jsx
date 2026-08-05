import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import BrandMark from '../../components/BrandMark'
import HeaderActions from '../../components/HeaderActions'
import SiteFooter from '../../components/SiteFooter'
import { toCurrency } from '../../utils/formatters'

function CustomerCartPage({
  cartItems,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  onStartOnlinePayment,
  onLogout,
  user,
}) {
  const navigate = useNavigate()
  const [deliveryMode, setDeliveryMode] = useState('courier')
  const [paymentMode, setPaymentMode] = useState('online')
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const volumeDiscount = subtotal > 0 ? Math.round(subtotal * 0.06) : 0
  const shipping = deliveryMode === 'courier' && subtotal > 0 ? 350 : 0
  const cashDiscount = paymentMode === 'online' ? Math.round(subtotal * 0.005) : 0
  const total = Math.max(0, subtotal + shipping - volumeDiscount - cashDiscount)

  const handleSubmitOrder = async () => {
    if (!cartItems.length) {
      setError('Add items to your cart before submitting a purchase order.')
      return
    }
    setError('')
    setPaying(true)
    try {
      if (paymentMode === 'online') {
        await onStartOnlinePayment({ deliveryMode, total })
        return
      }
      const order = await onSubmitOrder({ deliveryMode, paymentMode, total })
      if (order) {
        navigate('/order-success')
      }
    } catch (err) {
      setError(err.message || 'Unable to submit order')
    } finally {
      setPaying(false)
    }
  }

  return (
    <section className="cart-shell">
      <header className="cart-topbar">
        <BrandMark />
        <div className="header-icons">
          <NavLink to="/cart" className="icon-btn icon-32 cart-active" aria-label="Cart">
            <img src={assets.iconCart} alt="" />
          </NavLink>
          <HeaderActions user={user} onLogout={onLogout} profilePath="/profile" />
        </div>
      </header>

      <div className="cart-page">
        <div className="cart-heading">
          <div>
            <h1>WHOLE SALE CART</h1>
            <p>Review your bulk inventory selection.</p>
          </div>
          <button type="button" className="clear-cart" onClick={onClearCart} disabled={!cartItems.length}>
            <img src={assets.iconTrash} alt="" />
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          <div>
            <div className="cart-table">
              <div className="cart-table-head">
                <span>PRODUCT</span>
                <span>DETAILS</span>
                <span>UNIT WT.</span>
                <span>QUANTITY (PALLETS)</span>
                <span>TOTAL PRICE</span>
              </div>
              {cartItems.length === 0 ? (
                <div className="empty-state">
                  Your cart is empty.{' '}
                  <Link to="/categories" className="link-orange">
                    Browse categories
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div className="cart-line" key={item.id}>
                    <div className="cart-product">
                      <img src={item.image} alt={item.name} />
                      <h4>{item.name}</h4>
                    </div>
                    <span>{item.packLabel}</span>
                    <span>{item.unitWeight}</span>
                    <div className="cart-line-qty">
                      <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => onUpdateQuantity(item.id, event.target.value)}
                      />
                      <button type="button" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                      <button
                        type="button"
                        className="line-remove"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label="Remove item"
                      >
                        <img src={assets.iconTrash} alt="" />
                      </button>
                    </div>
                    <strong>{toCurrency(item.quantity * item.unitPrice)}</strong>
                  </div>
                ))
              )}
            </div>

            <section className="cart-section">
              <h2>Mode of Delivery</h2>
              <div className="delivery-cards">
                <button
                  type="button"
                  className={`delivery-card${deliveryMode === 'courier' ? ' selected' : ''}`}
                  onClick={() => setDeliveryMode('courier')}
                >
                  <div className="delivery-card__top">
                    <span className="delivery-icon truck" />
                    <span className={`radio${deliveryMode === 'courier' ? ' on' : ''}`} />
                  </div>
                  <h3>Courier Delivery</h3>
                  <p>LTL freight shipping for palletized wholesale orders. Est. transit 3–5 days.</p>
                  <p className="meta">Est. Cost {toCurrency(350)}</p>
                </button>
                <button
                  type="button"
                  className={`delivery-card${deliveryMode === 'pickup' ? ' selected' : ''}`}
                  onClick={() => setDeliveryMode('pickup')}
                >
                  <div className="delivery-card__top">
                    <span className="delivery-icon store" />
                    <span className={`radio${deliveryMode === 'pickup' ? ' on' : ''}`} />
                  </div>
                  <h3>Self-Pickup (HQ)</h3>
                  <p>Ready in 2-4 hours. No Logistic fee.</p>
                  <img className="mini-map" src={assets.mapLocation} alt="" />
                </button>
              </div>

              <div className="location-card">
                <div className="copy">
                  <h3>MarketBulk Central Hub</h3>
                  <p>Cavite logistics park · Dock gates open 7AM–6PM</p>
                  <a className="link-orange" href="#change-location">
                    Change Location
                  </a>
                </div>
                <img src={assets.mapLocation} alt="Pickup location map" />
              </div>
            </section>

            <section className="cart-section">
              <h2>Wholesale Payment</h2>
              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-option${paymentMode === 'online' ? ' selected' : ''}`}
                  onClick={() => setPaymentMode('online')}
                >
                  <span className="radio" />
                  <div>
                    <h4>Online Payment</h4>
                    <p>PayMongo checkout (card, GCash, Maya, QR Ph). 0.5% online discount.</p>
                  </div>
                  <span className="pay-icon bank" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`payment-option${paymentMode === 'cash' ? ' selected' : ''}`}
                  onClick={() => setPaymentMode('cash')}
                >
                  <span className="radio" />
                  <div>
                    <h4>Cash on Delivery</h4>
                    <p>Payment upon Delivery</p>
                  </div>
                  <span className="pay-icon cash" aria-hidden="true" />
                </button>
              </div>
            </section>
          </div>

          <aside className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({itemCount} items)</span>
              <strong>{toCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Logistics / Shipping</span>
              <span className="green">
                {deliveryMode === 'pickup' ? 'Free pickup' : toCurrency(shipping)}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax Exemption (Verified)</span>
              <strong>-{toCurrency(0)}</strong>
            </div>
            <div className="summary-row">
              <span>Volume Discount</span>
              <span className="orange">-{toCurrency(volumeDiscount)}</span>
            </div>
            {cashDiscount > 0 ? (
              <div className="summary-row">
                <span>Online Payment Discount</span>
                <span className="orange">-{toCurrency(cashDiscount)}</span>
              </div>
            ) : null}
            <hr className="summary-divider" />
            <p className="total-label">Total Payable</p>
            <p className="total-amount">{toCurrency(total)}</p>
            {error ? <p className="form-error">{error}</p> : null}
            <button
              type="button"
              className="btn-orange"
              onClick={handleSubmitOrder}
              disabled={!cartItems.length || paying}
            >
              {paying
                ? 'Please wait…'
                : paymentMode === 'online'
                  ? 'Pay Online'
                  : 'Submit Purchase Order'}
            </button>
            <p className="summary-note">
              By submitting, you agree to Arlen&apos;s wholesale terms of service and confirmed
              delivery window.
            </p>
            <div className="trust-row">
              <span className="trust-icon lock" />
              Secure Industrial-Grade Encryption
            </div>
            <div className="trust-row">
              <span className="trust-icon support" />
              Dedicated Specialist Available 24/7
            </div>
            <div style={{ marginTop: 18 }}>
              <Link to="/home" className="link-orange">
                ← Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </section>
  )
}

export default CustomerCartPage
