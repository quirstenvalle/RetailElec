import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../constants/assets'
import { formatDeliveryAddress } from '../utils/address'

function initialsFromName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function ProfileForm({ user, onSave, onLogout, backTo, backLabel }) {
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [businessName, setBusinessName] = useState(user?.businessName || '')
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '')
  const [deliveryCity, setDeliveryCity] = useState(user?.deliveryCity || '')
  const [deliveryProvince, setDeliveryProvince] = useState(user?.deliveryProvince || '')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState(user?.deliveryPostalCode || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setBusinessName(user?.businessName || '')
    setDeliveryAddress(user?.deliveryAddress || '')
    setDeliveryCity(user?.deliveryCity || '')
    setDeliveryProvince(user?.deliveryProvince || '')
    setDeliveryPostalCode(user?.deliveryPostalCode || '')
  }, [user])

  const initials = useMemo(() => initialsFromName(name || user?.name), [name, user?.name])
  const roleLabel = user?.role === 'admin' ? 'Store Administrator' : 'Wholesale Customer'
  const isCustomer = user?.role === 'customer'
  const formattedAddress = formatDeliveryAddress({
    deliveryAddress,
    deliveryCity,
    deliveryProvince,
    deliveryPostalCode,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await onSave({
        name,
        phone,
        businessName,
        deliveryAddress,
        deliveryCity,
        deliveryProvince,
        deliveryPostalCode,
      })
      setMessage('Your profile has been saved.')
    } catch (err) {
      setError(err.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-screen">
      <div className="profile-hero">
        <div className="profile-hero__glow" aria-hidden="true" />
        <div className="profile-hero__content">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div>
            <p className="profile-kicker">{roleLabel}</p>
            <h1>{name || user?.name || 'My Profile'}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-summary">
          <h2>Account overview</h2>
          <ul>
            <li>
              <span>Role</span>
              <strong>{user?.role === 'admin' ? 'Admin' : 'Customer'}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{user?.email || '—'}</strong>
            </li>
            <li>
              <span>Phone</span>
              <strong>{phone || 'Not set'}</strong>
            </li>
            {isCustomer ? (
              <>
                <li>
                  <span>Business</span>
                  <strong>{businessName || 'Not set'}</strong>
                </li>
                <li>
                  <span>Delivery address</span>
                  <strong>{formattedAddress || 'Not set'}</strong>
                </li>
              </>
            ) : null}
          </ul>
          <div className="profile-tip">
            <img src={assets.iconAvatar} alt="" />
            <p>
              {isCustomer
                ? 'Save your delivery address here so it is ready at checkout.'
                : 'Click the profile icon in the header anytime to return here.'}
            </p>
          </div>
          {onLogout ? (
            <button type="button" className="btn-ghost profile-signout" onClick={onLogout}>
              Sign out
            </button>
          ) : null}
        </aside>

        <form className="profile-panel" onSubmit={handleSubmit}>
          <div className="profile-panel__head">
          {isCustomer ? (
            <Link to="/rewards" className="profile-rewards-link">
              <span className="profile-rewards-link__icon" aria-hidden="true">*</span>
              <span>
                <strong>My Rewards</strong>
                <small>View vouchers, coupons, and raffle entries</small>
              </span>
              <b>1,250 Points</b>
            </Link>
          ) : null}
            <div>
              <h2>Edit details</h2>
              <p>Keep your wholesale account information up to date.</p>
            </div>
            <Link to={backTo} className="profile-back">
              ← {backLabel}
            </Link>
          </div>

          <div className="profile-fields">
            <div className="field">
              <label htmlFor="profileName">FULL NAME</label>
              <input
                id="profileName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div className="field">
              <label htmlFor="profileEmail">EMAIL</label>
              <input id="profileEmail" value={user?.email || ''} disabled />
              <small className="field-hint">Email is tied to your login and cannot be changed here.</small>
            </div>
            <div className="field">
              <label htmlFor="profilePhone">PHONE</label>
              <input
                id="profilePhone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0912-345-6789"
              />
            </div>
            {isCustomer ? (
              <>
                <div className="field">
                  <label htmlFor="profileBusiness">BUSINESS NAME</label>
                  <input
                    id="profileBusiness"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="e.g. Dela Cruz Mini Mart"
                  />
                </div>

                <div className="profile-section-label">Delivery address</div>
                <div className="field">
                  <label htmlFor="profileStreet">STREET / BUILDING</label>
                  <textarea
                    id="profileStreet"
                    rows={3}
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Unit / street / barangay"
                  />
                </div>
                <div className="profile-address-grid">
                  <div className="field">
                    <label htmlFor="profileCity">CITY / MUNICIPALITY</label>
                    <input
                      id="profileCity"
                      value={deliveryCity}
                      onChange={(event) => setDeliveryCity(event.target.value)}
                      placeholder="e.g. Imus"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profileProvince">PROVINCE</label>
                    <input
                      id="profileProvince"
                      value={deliveryProvince}
                      onChange={(event) => setDeliveryProvince(event.target.value)}
                      placeholder="e.g. Cavite"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profilePostal">POSTAL CODE</label>
                    <input
                      id="profilePostal"
                      value={deliveryPostalCode}
                      onChange={(event) => setDeliveryPostalCode(event.target.value)}
                      placeholder="e.g. 4103"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <div className="profile-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link to={backTo} className="btn-ghost profile-cancel">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}

export default ProfileForm
