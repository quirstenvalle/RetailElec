import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import BrandMark from '../../components/BrandMark'
import HeaderActions from '../../components/HeaderActions'
import { toCurrency } from '../../utils/formatters'

function RatingField({ label, value, onChange }) {
  return (
    <div className="review-field">
      <span>{label}</span>
      <div className="review-rating" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} type="button" className={rating <= value ? 'selected' : ''} onClick={() => onChange(rating)} aria-label={`${rating} stars`}>
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderSuccessPage({ order, onLogout, user, onSubmitReviews }) {
  const navigate = useNavigate()
  const items = order?.items || []
  const [ratings, setRatings] = useState({ store: 0, order: 0 })
  const [comments, setComments] = useState({ store: '', order: '' })
  const [reviewState, setReviewState] = useState('idle')
  const [reviewError, setReviewError] = useState('')

  const submitReview = async (event) => {
    event.preventDefault()
    setReviewError('')
    setReviewState('saving')
    try {
      await onSubmitReviews({
        orderNumber: order.orderNumber || order.id,
        storeRating: ratings.store,
        storeComment: comments.store,
        orderRating: ratings.order,
        orderComment: comments.order,
      })
      setReviewState('saved')
      navigate('/home', { replace: true })
    } catch (error) {
      setReviewError(error.message || 'Could not save your review')
      setReviewState('idle')
    }
  }

  return (
    <section className="success-shell">
      <header className="cart-topbar success-topbar">
        <BrandMark />
        <div className="header-icons">
          <NavLink to="/cart" className="icon-btn icon-32" aria-label="Cart">
            <img src={assets.iconCart} alt="" />
          </NavLink>
          <HeaderActions user={user} onLogout={onLogout} profilePath="/profile" />
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
                <p>{order.orderDate}</p>
              </article>
              <article>
                <h4>ESTIMATED DELIVERY</h4>
                <p className="green-text">
                  {order.deliveryMode === 'pickup' ? 'Ready in 2–4 hours' : 'Aug 04 - Aug 07'}
                </p>
                <div className="meta-footnote">
                  <span className="truck-icon" />{' '}
                  {order.deliveryMode === 'pickup' ? 'Self-Pickup' : 'Standard Logistic'}
                </div>
              </article>
              <article className="amount-card">
                <h4>TOTAL AMOUNT PAID</h4>
                <p>{toCurrency(order.total)}</p>
                <small>
                  {order.paymentMode === 'cash'
                    ? 'Cash on Delivery — pay upon receipt'
                    : 'Paid online via secure checkout'}
                </small>
              </article>
            </div>

            <div className="success-items">
              <h3>Order Summary</h3>
              {items.map((item) => {
                const pricingUnit =
                  item.pricingUnit === 'piece'
                    ? 'piece'
                    : item.pricingUnit === 'pack'
                      ? 'pack'
                      : 'box'
                const linePrice =
                  Number(item.linePrice) ||
                  (pricingUnit === 'piece'
                    ? item.piecePrice
                    : pricingUnit === 'pack'
                      ? item.packPrice
                      : item.unitPrice) ||
                  0
                return (
                  <div key={item.cartKey || `${item.id}:${pricingUnit}`}>
                    <div className="success-item">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          Qty. {item.quantity} ·{' '}
                          {pricingUnit === 'piece'
                            ? 'Per piece'
                            : pricingUnit === 'pack'
                              ? 'Per pack'
                              : 'Per box'}
                        </span>
                      </div>
                    </div>
                    <strong>{toCurrency(linePrice * item.quantity)}</strong>
                  </div>
                )
              })}
            </div>

            <form className="order-review-form" onSubmit={submitReview}>
              <div>
                <h3>How did we do?</h3>
                <p>Share feedback about Quinto Store and this transaction.</p>
              </div>
              <RatingField label="Store experience" value={ratings.store} onChange={(value) => setRatings((current) => ({ ...current, store: value }))} />
              <textarea required rows="3" value={comments.store} onChange={(event) => setComments((current) => ({ ...current, store: event.target.value }))} placeholder="Tell us about your store experience" />
              <RatingField label="This order" value={ratings.order} onChange={(value) => setRatings((current) => ({ ...current, order: value }))} />
              <textarea required rows="3" value={comments.order} onChange={(event) => setComments((current) => ({ ...current, order: event.target.value }))} placeholder="Tell us about this order" />
              {reviewError ? <p className="form-error">{reviewError}</p> : null}
              {reviewState === 'saved' ? <p className="review-success">Thanks for helping us improve.</p> : <button type="submit" className="btn-green" disabled={reviewState === 'saving'}>{reviewState === 'saving' ? 'Saving review…' : 'Submit review'}</button>}
            </form>

            <div className="success-actions">
              <Link to="/home" className="btn-green">
                Return to Shop
              </Link>
              <Link to="/orders" className="btn-ghost success-ghost">
                Track your Order
              </Link>
            </div>
          </>
        )}
      </div>

      <footer className="success-footer">
        © 2024 Quinto Store Wholesale Group. Built for Entrepreneurs
      </footer>
    </section>
  )
}

export default OrderSuccessPage
