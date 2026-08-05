import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BrandMark from '../../components/BrandMark'
import HeaderActions from '../../components/HeaderActions'
import { confirmCheckout } from '../../api/paymentsApi'

function PaymentDemoPage({ onPaid, onLogout, user }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const referenceNumber = params.get('ref') || ''
  const [cardName, setCardName] = useState('Juan Dela Cruz')
  const [cardNumber, setCardNumber] = useState('4343 4343 4343 4343')
  const [expiry, setExpiry] = useState('12/30')
  const [cvc, setCvc] = useState('123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async (event) => {
    event.preventDefault()
    if (!referenceNumber) {
      setError('Missing payment reference.')
      return
    }
    if (cardNumber.replace(/\s/g, '').length < 12) {
      setError('Enter a valid demo card number.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await confirmCheckout(referenceNumber)
      onPaid?.(result.order)
      navigate('/order-success')
    } catch (err) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="payment-shell">
      <header className="cart-topbar">
        <BrandMark />
        <HeaderActions user={user} onLogout={onLogout} profilePath="/profile" />
      </header>

      <div className="payment-page">
        <div className="payment-card">
          <p className="payment-eyebrow">Demo Online Checkout</p>
          <h1>Pay securely</h1>
          <p className="payment-copy">
            PayMongo secret key is not configured yet, so this demo gate simulates a successful
            card charge. With live keys configured, you are redirected to PayMongo hosted checkout
            instead.
          </p>
          <p className="payment-ref">Reference: {referenceNumber || '—'}</p>

          <form className="payment-form" onSubmit={handlePay}>
            <div className="field">
              <label htmlFor="cardName">NAME ON CARD</label>
              <input
                id="cardName"
                value={cardName}
                onChange={(event) => setCardName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cardNumber">CARD NUMBER</label>
              <input
                id="cardNumber"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                required
                inputMode="numeric"
              />
            </div>
            <div className="payment-form-grid">
              <div className="field">
                <label htmlFor="expiry">EXPIRY</label>
                <input
                  id="expiry"
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                  required
                  placeholder="MM/YY"
                />
              </div>
              <div className="field">
                <label htmlFor="cvc">CVC</label>
                <input
                  id="cvc"
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value)}
                  required
                  inputMode="numeric"
                />
              </div>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn-orange" disabled={loading}>
              {loading ? 'Processing…' : 'Pay now'}
            </button>
            <Link to="/cart" className="link-orange payment-back">
              ← Back to cart
            </Link>
          </form>
        </div>
      </div>
    </section>
  )
}

export default PaymentDemoPage
