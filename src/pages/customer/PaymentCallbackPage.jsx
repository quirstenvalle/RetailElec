import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmCheckout } from '../../api/paymentsApi'

function PaymentCallbackPage({ onPaid }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const referenceNumber = params.get('ref') || ''
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Confirming your PayMongo payment…')

  useEffect(() => {
    let cancelled = false

    async function confirm() {
      if (!referenceNumber) {
        setError('Missing payment reference.')
        return
      }

      try {
        const result = await confirmCheckout(referenceNumber)
        if (cancelled) return
        onPaid?.(result.order)
        navigate('/order-success', { replace: true })
      } catch (err) {
        if (cancelled) return
        if (err.awaiting) {
          setStatus('Payment is still processing. Retrying…')
          setTimeout(confirm, 2500)
          return
        }
        setError(err.message || 'Unable to confirm payment')
      }
    }

    confirm()
    return () => {
      cancelled = true
    }
  }, [navigate, onPaid, referenceNumber])

  return (
    <section className="payment-shell">
      <div className="payment-page">
        <div className="payment-card">
          <h1>Online Payment</h1>
          {error ? (
            <>
              <p className="form-error">{error}</p>
              <Link to="/cart" className="btn-orange">
                Return to cart
              </Link>
            </>
          ) : (
            <p className="payment-copy">{status}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default PaymentCallbackPage
