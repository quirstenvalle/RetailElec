import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

function RegisterPage({ onRegister }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const result = await onRegister({
      businessName: formData.get('businessName'),
      contactName: formData.get('contactName'),
      email: formData.get('email'),
      contactNumber: formData.get('contactNumber'),
      deliveryAddress: formData.get('deliveryAddress'),
      deliveryCity: formData.get('deliveryCity'),
      deliveryProvince: formData.get('deliveryProvince'),
      deliveryPostalCode: formData.get('deliveryPostalCode'),
      password,
    })

    if (!result?.ok) {
      setError(result?.error || 'Unable to create account.')
      return
    }

    navigate('/login', { state: { registered: true } })
  }

  return (
    <AuthSplitLayout
      title="CREATE ACCOUNT"
      subtitle="Enter your business details to apply for wholesale access"
      image={assets.registerHero}
      imageOn="left"
    >
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="businessName">BUSINESS NAME</label>
          <input id="businessName" name="businessName" required placeholder="e.g. Dela Cruz Mini Mart" />
        </div>
        <div className="field">
          <label htmlFor="licenseNumber">BUSINESS LICENSE NUMBER</label>
          <input id="licenseNumber" name="licenseNumber" required placeholder="XX-XXXXXXXXX" />
        </div>
        <div className="field">
          <label htmlFor="contactName">PRIMARY CONTACT NAME</label>
          <input id="contactName" name="contactName" required placeholder="Juan Dela Cruz" />
        </div>
        <div className="field">
          <label htmlFor="email">EMAIL</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="juandelacruz@gmail.com"
          />
        </div>
        <div className="field">
          <label htmlFor="contactNumber">CONTACT NUMBER</label>
          <input id="contactNumber" name="contactNumber" required placeholder="0912-345-6789" />
        </div>

        <div className="auth-section-label">Delivery address</div>
        <div className="field">
          <label htmlFor="deliveryAddress">STREET / BUILDING</label>
          <textarea
            id="deliveryAddress"
            name="deliveryAddress"
            rows={3}
            required
            placeholder="Unit / street / barangay"
          />
        </div>
        <div className="auth-address-grid">
          <div className="field">
            <label htmlFor="deliveryCity">CITY / MUNICIPALITY</label>
            <input id="deliveryCity" name="deliveryCity" required placeholder="e.g. Imus" />
          </div>
          <div className="field">
            <label htmlFor="deliveryProvince">PROVINCE</label>
            <input id="deliveryProvince" name="deliveryProvince" required placeholder="e.g. Cavite" />
          </div>
          <div className="field">
            <label htmlFor="deliveryPostalCode">POSTAL CODE</label>
            <input id="deliveryPostalCode" name="deliveryPostalCode" placeholder="e.g. 4103" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="*********"
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="*********"
          />
        </div>
        <label className="check-row">
          <input required type="checkbox" />
          <span>I agree to the Term of Service and Privacy Policy</span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn-orange">
          CREATE ACCOUNT
        </button>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}

export default RegisterPage
