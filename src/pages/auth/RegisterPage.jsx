import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'
import { supabase } from '../../lib/supabaseClient'

function RegisterPage({ onRegister, user }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isVerifiedParam = searchParams.get('verified') === 'true' || window.location.hash.includes('access_token')

  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isVerified, setIsVerified] = useState(isVerifiedParam)

  useEffect(() => {
    // Listen for authentication confirmation across tabs and redirects
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || session?.user) {
        setIsVerified(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // If a user is already logged in and not looking at registration/verification, forward to home
  useEffect(() => {
    if (user && !submittedEmail && !isVerified && !isVerifiedParam) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/home', { replace: true })
    }
  }, [user, submittedEmail, isVerified, isVerifiedParam, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
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
      email,
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

    setSubmittedEmail(email)
  }

  // 1. ALL SET UP SCREEN (Rendered upon successful email verification)
  if (isVerified) {
    return (
      <AuthSplitLayout
        title="ALL SET UP!"
        subtitle="Your email has been verified"
        image={assets.registerHero}
        imageOn="left"
      >
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '2px solid #10b981',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            Account Verified Successfully
          </h3>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '28px', lineHeight: '1.6' }}>
            Welcome to Quinto Store! Your wholesale customer account and reward profile are activated. You can now start browsing the catalog and placing orders.
          </p>

          <button
            type="button"
            className="btn-orange"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/home')}
          >
            CONTINUE TO STORE
          </button>
        </div>
      </AuthSplitLayout>
    )
  }

  // 2. CHECK YOUR EMAIL SCREEN (Rendered right after form submission)
  if (submittedEmail) {
    return (
      <AuthSplitLayout
        title="CHECK YOUR EMAIL"
        subtitle="Verification link sent"
        image={assets.registerHero}
        imageOn="left"
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '16px', lineHeight: '1.6' }}>
            We sent a confirmation link to:
            <br />
            <strong>{submittedEmail}</strong>
          </p>
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Please click the link inside your email to activate your account before logging in. If you don't see it, check your spam or promotions folder.
          </p>
          <p style={{ color: '#ea580c', fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' }}>
            Waiting for confirmation…
          </p>
          <button
            type="button"
            className="btn-orange"
            onClick={() => navigate('/login')}
          >
            PROCEED TO LOGIN
          </button>
        </div>
      </AuthSplitLayout>
    )
  }

  // 3. REGISTRATION FORM
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