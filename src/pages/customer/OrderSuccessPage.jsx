import { Link, NavLink } from 'react-router-dom'
import { assets } from '../../constants/assets'
import BrandMark from '../../components/BrandMark'
import { toCurrency } from '../../utils/formatters'

function OrderSuccessPage({ order }) {
  const items = order?.items || []

  return (
    <section className="success-shell">
      <header className="cart-topbar success-topbar">
        <BrandMark />
        <div className="header-icons">
          <NavLink to="/cart" className="icon-btn icon-32" aria-label="Cart">
            <img src={assets.iconCart} alt="" />
          </NavLink>
          <button type="button" className="icon-btn icon-32" aria-label="Notifications">
            <img src={assets.iconBell} alt="" />
          </button>
          <button type="button" className="icon-btn icon-36" aria-label="Account">
            <img src={assets.iconAvatar} alt="" />
          </button>
        </div>
      </header>

      <div className="success-page">
        {!order ? (
          <>
            <h1>No recent order found</h1>
            <p>Place a wholesale order from your cart to see the confirmation details here.</p>
            <div className="success-actions">
              <Link to="/home" className="btn-green">
                Return to Shop
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="success-seal" aria-hidden="true">
              <span>✓</span>
            </div>
            <h1>Thank you for your order!</h1>
            <p className="success-copy">
              We&apos;ve received your orders and our team is already preparing it for shipment.
              You&apos;ll receive a confirmation email shortly.
            </p>

            <div className="success-meta">
              <article>
                <h4>ORDER NUMBER</h4>
                <p>{order.id}</p>
                <h4>ORDER DATE</h4>
                <p>August 01, 2026</p>
              </article>
              <article>
                <h4>ESTIMATED DELIVERY</h4>
                <p className="green-text">Aug 04 - Aug 07</p>
                <div className="meta-footnote">
                  <span className="truck-icon" /> Standard Logistic
                </div>
              </article>
              <article className="amount-card">
                <h4>TOTAL AMOUNT PAID</h4>
                <p>{toCurrency(order.total)}</p>
                <small>Payment processed via Secure Check out</small>
              </article>
            </div>

            <div className="success-items">
              <h3>Order Summary</h3>
              {items.map((item) => (
                <div key={item.id}>
                  <div className="success-item">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>Qty. {item.quantity}</span>
                    </div>
                  </div>
                  <strong>{toCurrency(item.unitPrice * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="success-actions">
              <Link to="/home" className="btn-green">
                Return to Shop
              </Link>
              <button type="button" className="btn-ghost success-ghost">
                Track your Order
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="success-footer">
        © 2024 Arlen&apos;s Store Wholesale Group. Built for Entrepreneurs
      </footer>
    </section>
  )
}

export default OrderSuccessPage
