import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

function ForgotPasswordPage({ onRequestReset }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)
    try {
      await onRequestReset(email)
      setMessage('Check your email for a password reset link.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to send the reset link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Forgot Password?"
      subtitle="Enter your account email and we will send a secure reset link."
      image={assets.loginHero}
      logo={assets.brandMark}
      imageOn="right"
      bordered
    >
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="reset-email">EMAIL</label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            placeholder="merchant@example.com"
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}
        <button type="submit" className="btn-orange" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}

export default ForgotPasswordPage
