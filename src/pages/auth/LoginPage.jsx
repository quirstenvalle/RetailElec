import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

const SECRET_CLICKS = 3
const SECRET_RESET_MS = 2000

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const clickCountRef = useRef(0)
  const resetTimerRef = useRef(null)

  const handleLogoClick = useCallback(() => {
    clickCountRef.current += 1
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, SECRET_RESET_MS)

    if (clickCountRef.current >= SECRET_CLICKS) {
      clickCountRef.current = 0
      navigate('/admin/login')
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const result = await onLogin({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!result?.ok) {
      setError(result?.error || 'Unable to sign in.')
      return
    }

    navigate('/home')
  }

  return (
    <AuthSplitLayout
      title="Merchant Sign In"
      subtitle="Sign in with your merchant account to browse wholesale products and place orders."
      image={assets.loginHero}
      logo={assets.brandMark}
      onLogoClick={handleLogoClick}
      imageOn="right"
      bordered
    >
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">EMAIL</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="merchant@example.com"
          />
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="password">PASSWORD</label>
            <a className="link-orange" href="#forgot">
              Forgot Password?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="************"
          />
        </div>
        <label className="check-row">
          <input type="checkbox" name="remember" />
          <span>Remember me for 30 days</span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn-orange">
          Sign In
        </button>
        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </p>
        <p className="auth-tip">Demo merchant: customer@arlen.store / customer123</p>
      </form>
    </AuthSplitLayout>
  )
}

export default LoginPage
