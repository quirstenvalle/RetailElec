import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'
import { supabase } from '../../lib/supabaseClient'

function RegisterPage({ onRegister, user }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(() => {
    return (
      searchParams.get('verified') === 'true' ||
      window.location.hash.includes('access_token')
    )
  })

  // Clean query and hash parameters so refreshing does not lock the screen on "verified"
  useEffect(() => {
    if (searchParams.get('verified') === 'true' || window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [searchParams])

  // Listen for active confirmation events
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'USER_UPDATED') &&
        (submittedEmail || searchParams.get('verified') === 'true')
      ) {
        setIsVerified(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [submittedEmail, searchParams])

  const handleResetForm = async () => {
    try {
      await supabase.auth.signOut()
    } catch (_) {
      // Ignore cleanup signout errors
    }
    setIsVerified(false)
    setSubmittedEmail('')
    setError('')
    window.history.replaceState({}, document.title, window.location.pathname)
  }

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

  // 1. ALL SET UP SCREEN (Animated checkmark)
  if (isVerified) {
    return (
      <AuthSplitLayout
        title="ALL SET UP!"
        subtitle="Your email has been verified"
        image={assets.registerHero}
        imageOn="left"
      >
        <style>{`
          .setup-container {
            text-align: center;
            padding: 32px 0;
            animation: setupFadeIn 0.5s ease-out forwards;
          }
          .checkmark-badge {
            width: 88px;
            height: 88px;
            margin: 0 auto 24px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .checkmark-circle-bg {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background-color: #ecfdf5;
            position: absolute;
            animation: popScale 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .checkmark-svg {
            width: 52px;
            height: 52px;
            position: relative;
            z-index: 2;
          }
          .checkmark-svg-circle {
            stroke: #10b981;
            stroke-width: 3;
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: strokeAnim 0.6s 0.1s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          .checkmark-svg-path {
            stroke: #10b981;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: strokeAnim 0.35s 0.45s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          @keyframes popScale {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes strokeAnim {
            100% { stroke-dashoffset: 0; }
          }
          @keyframes setupFadeIn {
            0% { opacity: 0; transform: translateY(16px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="setup-container">
          <div className="checkmark-badge">
            <div className="checkmark-circle-bg" />
            <svg className="checkmark-svg" viewBox="0 0 52 52">
              <circle
                className="checkmark-svg-circle"
                cx="26"
                cy="26"
                r="24"
                fill="none"
              />
              <path
                className="checkmark-svg-path"
                fill="none"
                d="M14 27l8 8 16-16"
              />
            </svg>
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
            Account Verified Successfully
          </h3>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '28px', lineHeight: '1.6' }}>
            Welcome to Quinto Store! Your wholesale customer account and rewards profile are ready.
          </p>

          <button
            type="button"
            className="btn-orange"
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/home')}
          >
            CONTINUE TO STORE
          </button>

          <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
            <button
              type="button"
              onClick={handleResetForm}
              style={{
                background: 'none',
                border: 'none',
                color: '#ea580c',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline',
              }}
            >
              Register another account
            </button>
          </p>
        </div>
      </AuthSplitLayout>
    )
  }

  // 2. CHECK YOUR EMAIL SCREEN
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
          <p style={{ color: '#ea580c', fontSize: '0.85rem', fontWeight: '600', marginBottom: '24px' }}>
            Waiting for email verification…
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-orange"
              onClick={() => navigate('/login')}
            >
              PROCEED TO LOGIN
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              style={{
                padding: '0 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </AuthSplitLayout>
    )
  }

  // 3. REGISTRATION FORM (Default View)
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