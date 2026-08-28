import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

function AdminLoginPage({ onLogin }) {
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

    navigate('/admin/dashboard')
  }

  return (
    <AuthSplitLayout
      title="Admin Sign In"
      subtitle="Administrator access only. Use your staff credentials to manage the store."
      image={assets.loginHero}
      logo={assets.brandMark}
      imageOn="right"
      bordered
    >
      <form className="auth-fields" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-email">ADMIN EMAIL</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@arlen.store"
          />
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="admin-password">PASSWORD</label>
          </div>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="************"
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn-green">
          Sign In as Admin
        </button>
        <p className="auth-footer">
          <Link to="/">Back to home</Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}

export default AdminLoginPage
