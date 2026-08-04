import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../../constants/assets'
import AuthSplitLayout from '../../components/AuthSplitLayout'

function LoginPage({ onLogin }) {
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'customer'
    const name = email.split('@')[0] || 'User'

    onLogin({ role, name, email })
    navigate(role === 'admin' ? '/admin/dashboard' : '/home')
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
          <input id="email" name="email" type="email" required placeholder="juandelacruz@gmail.com" />
        </div>
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="password">PASSWORD</label>
            <a className="link-orange" href="#forgot">
              Forgot Password?
            </a>
          </div>
          <input id="password" name="password" type="password" required placeholder="************" />
        </div>
        <label className="check-row">
          <input type="checkbox" />
          <span>Remember me for 30 days</span>
        </label>
        <button type="submit" className="btn-orange">
          Sign In
        </button>
        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </AuthSplitLayout>
  )
}

export default LoginPage
