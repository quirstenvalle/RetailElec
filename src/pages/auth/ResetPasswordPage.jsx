import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'
import { supabase } from '../../lib/supabaseClient'

function ResetPasswordPage({ onResetPassword }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === 'PASSWORD_RECOVERY' || session)) setReady(true)
    })
    return () => {
      active = false
      listener.subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await onResetPassword(password)
      setMessage('Your password has been updated. You can now sign in.')
      await supabase.auth.signOut()
    } catch (resetError) {
      setError(resetError.message || 'Unable to update your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Create a New Password"
      subtitle="Choose a new password for your Quinto Store account."
      image={assets.loginHero}
      logo={assets.brandMark}
      imageOn="right"
      bordered
    >
      {!ready && !message ? <p className="form-error">This reset link is invalid or has expired.</p> : null}
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-password">NEW PASSWORD</label>
          <input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
          <input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}
        <button type="submit" className="btn-orange" disabled={!ready || submitting || Boolean(message)}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
        <p className="auth-footer"><Link to="/login" onClick={() => navigate('/login')}>Back to sign in</Link></p>
      </form>
    </AuthSplitLayout>
  )
}

export default ResetPasswordPage
