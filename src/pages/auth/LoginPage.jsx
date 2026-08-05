import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

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

    navigate(result.role === 'admin' ? '/admin/dashboard' : '/home')
  }

  return (
    <AuthSplitLayout
      title="Sign in to Dashboard"
      subtitle="Enter your business credentials to access your account."
      image={assets.loginHero}
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
            placeholder="juandelacruz@gmail.com"
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
        <p className="auth-tip">
          Demo: admin@arlen.store / admin123 or customer@arlen.store / customer123
        </p>
      </form>
    </AuthSplitLayout>
  )
}

export default LoginPage
