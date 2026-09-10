import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { fetchAvailableVouchers, markVoucherAsUsed } from '../../api/rewardsApi'
import BrandMark from '../../components/BrandMark'
import HeaderActions from '../../components/HeaderActions'
import SiteFooter from '../../components/SiteFooter'
import { assets } from '../../constants/assets'
import { formatDeliveryAddress } from '../../utils/address'
import { toCurrency } from '../../utils/formatters'

function CustomerCartPage({
  cartItems,
  subtotal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  onStartOnlinePayment,
  onSaveDeliveryAddress,
  onLogout,
  user,
}) {
  const navigate = useNavigate()
  const [deliveryMode, setDeliveryMode] = useState('courier')
  const [paymentMode, setPaymentMode] = useState('online')
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '')
  const [deliveryCity, setDeliveryCity] = useState(user?.deliveryCity || '')
  const [deliveryProvince, setDeliveryProvince] = useState(user?.deliveryProvince || '')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(user?.deliveryPostalCode || '')

  const [availableVouchers, setAvailableVouchers] = useState([])
  const [selectedVoucherId, setSelectedVoucherId] = useState('')

  useEffect(() => {
    setDeliveryAddress(user?.deliveryAddress || '')
    setDeliveryCity(user?.deliveryCity || '')
    setDeliveryProvince(user?.deliveryProvince || '')
    setDeliveryPostalCode(user?.deliveryPostalCode || '')
  }, [user])

  useEffect(() => {
    let active = true
    fetchAvailableVouchers()
      .then((data) => {
        if (active) setAvailableVouchers(data)
      })
      .catch(() => {
        if (active) setAvailableVouchers([])
      })
    return () => {
      active = false
    }
  }, [user?.id])

  const selectedVoucher = availableVouchers.find((v) => v.id === selectedVoucherId)
  const isVoucherEligible = !selectedVoucher || subtotal >= (selectedVoucher.minimumOrder || 0)
  const voucherDiscount =
    selectedVoucher && isVoucherEligible ? Math.min(subtotal, selectedVoucher.discountAmount) : 0

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const volumeDiscount = subtotal > 0 ? Math.round(subtotal * 0.06) : 0
  const shipping = 0
  const cashDiscount = paymentMode === 'online' ? Math.round(subtotal * 0.005) : 0
  const total = Math.max(0, subtotal - volumeDiscount - cashDiscount - voucherDiscount)

  const shippingAddress = {
    deliveryAddress,
    deliveryCity,
    deliveryProvince,
    deliveryPostalCode,
  }

  const handleSubmitOrder = async () => {
    if (!cartItems.length) {
      setError('Add items to your cart before submitting a purchase order.')
      return
    }
    if (deliveryMode === 'courier' && !String(deliveryAddress || '').trim()) {
      setError('Enter a delivery street address for courier delivery.')
      return
    }
    if (deliveryMode === 'courier' && !String(deliveryCity || '').trim()) {
      setError('Enter a city/municipality for courier delivery.')
      return
    }
    if (selectedVoucher && !isVoucherEligible) {
      setError(`Voucher requires a minimum purchase of ${toCurrency(selectedVoucher.minimumOrder)}.`)
      return
    }

    setError('')
    setPaying(true)
    try {
      if (deliveryMode === 'courier' && onSaveDeliveryAddress) {
        await onSaveDeliveryAddress(shippingAddress)
      }
      if (paymentMode === 'online') {
        if (selectedVoucherId) {
          await markVoucherAsUsed(selectedVoucherId)
        }
        await onStartOnlinePayment({ deliveryMode, total, shippingAddress })
        return
      }

      const order = await onSubmitOrder({ deliveryMode, paymentMode, total, shippingAddress })
      if (order) {
        if (selectedVoucherId) {
          await markVoucherAsUsed(selectedVoucherId)
        }
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
                <span>UNIT</span>
                <span>QUANTITY</span>
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
                  <div className="cart-line" key={item.cartKey || `${item.id}:${item.pricingUnit || 'box'}`}>
                    <div className="cart-product">
                      <img src={item.image} alt={item.name} />
                      <h4>{item.name}</h4>
                    </div>
                    <span>
                      {item.packLabel}
                      <br />
                      <small className="cart-unit-note">
                        {toCurrency(item.linePrice)}{' '}
                        {item.pricingUnit === 'piece'
                          ? '/ pc'
                          : item.pricingUnit === 'pack'
                            ? '/ pack'
                            : '/ box'}
                      </small>
                    </span>
                    <span className="cart-unit-badge">
                      {item.pricingUnit === 'piece'
                        ? 'Per piece'
                        : item.pricingUnit === 'pack'
                          ? 'Per pack'
                          : 'Per box'}
                    </span>
                    <div className="cart-line-qty">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.pricingUnit)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          onUpdateQuantity(item.id, event.target.value, item.pricingUnit)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.pricingUnit)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="line-remove"
                        onClick={() => onRemoveItem(item.id, item.pricingUnit)}
                        aria-label="Remove item"
                      >
                        <img src={assets.iconTrash} alt="" />
                      </button>
                    </div>
                    <strong>{toCurrency(item.quantity * item.linePrice)}</strong>
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
                  <p className="meta">To be quoted after admin booking.</p>
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
                  <p>Ready in 2-4 hours. No logistic fee.</p>
                </button>
              </div>

              <div className="location-card">
                {deliveryMode === 'courier' ? (
                  <div className="copy delivery-address-block">
                    <h3>Delivery Address</h3>
                    <p>Where should we deliver this wholesale order?</p>
                    <div className="profile-fields delivery-address-fields">
                      <div className="field">
                        <label htmlFor="cartStreet">STREET / BUILDING</label>
                        <textarea
                          id="cartStreet"
                          rows={3}
                          value={deliveryAddress}
                          onChange={(event) => setDeliveryAddress(event.target.value)}
                          placeholder="Unit / street / barangay"
                          required
                        />
                      </div>
                      <div className="profile-address-grid">
                        <div className="field">
                          <label htmlFor="cartCity">CITY</label>
                          <input
                            id="cartCity"
                            value={deliveryCity}
                            onChange={(event) => setDeliveryCity(event.target.value)}
                            placeholder="City / Municipality"
                            required
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="cartProvince">PROVINCE</label>
                          <input
                            id="cartProvince"
                            value={deliveryProvince}
                            onChange={(event) => setDeliveryProvince(event.target.value)}
                            placeholder="Province"
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="cartPostal">POSTAL CODE</label>
                          <input
                            id="cartPostal"
                            value={deliveryPostalCode}
                            onChange={(event) => setDeliveryPostalCode(event.target.value)}
                            placeholder="Postal code"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="delivery-address-preview">
                      {formatDeliveryAddress(shippingAddress) || 'Address preview will appear here.'}
                    </p>
                    <Link to="/profile" className="link-orange">
                      Manage saved address in Profile
                    </Link>
                  </div>
                ) : (
                  <div className="copy">
                    <h3>Quinto Store Hub</h3>
                    <p>Cavite logistics park · Dock gates open 7AM–6PM</p>
                    <p className="delivery-address-preview">Self-pickup does not require a delivery address.</p>
                  </div>
                )}
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

            {/* Voucher Selection */}
            <div style={{ margin: '14px 0', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              <label
                htmlFor="cartVoucher"
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#4b5563',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                APPLY REDEEMED VOUCHER
              </label>
              <select
                id="cartVoucher"
                value={selectedVoucherId}
                onChange={(e) => setSelectedVoucherId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">No voucher selected</option>
                {availableVouchers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.code}) — {toCurrency(v.discountAmount)} OFF
                  </option>
                ))}
              </select>
              {selectedVoucher && !isVoucherEligible ? (
                <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                  Requires minimum order of {toCurrency(selectedVoucher.minimumOrder)}
                </small>
              ) : null}
            </div>

            {voucherDiscount > 0 ? (
              <div className="summary-row">
                <span>Voucher Discount</span>
                <span className="orange" style={{ color: '#059669', fontWeight: 700 }}>
                  -{toCurrency(voucherDiscount)}
                </span>
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
              By submitting, you agree to Quinto Store wholesale terms of service and confirmed
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