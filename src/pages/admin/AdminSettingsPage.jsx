import { useEffect, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  changePassword,
  fetchStoreSettings,
  updateAppPreferences,
  updateNotificationSettings,
  updateStoreInfo,
} from '../../api/settingsApi'
import { saveState } from '../../utils/storage'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'store', label: 'Store' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
]

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <label className="settings-toggle" htmlFor={id}>
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="settings-toggle__track" aria-hidden="true" />
    </label>
  )
}

function AdminSettingsPage({ user, onSaveProfile, onLogout }) {
  const { setSidebarOpen } = useOutletContext() || {}
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'profile'

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [storeName, setStoreName] = useState('Quinto Store')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notifyNewOrders, setNotifyNewOrders] = useState(true)
  const [notifyLowStock, setNotifyLowStock] = useState(true)
  const [notifyCancellations, setNotifyCancellations] = useState(true)
  const [sidebarOpenDefault, setSidebarOpenDefault] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
  }, [user?.name, user?.phone])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const settings = await fetchStoreSettings()
        if (!active) return
        setStoreName(settings.storeName)
        setContactEmail(settings.contactEmail)
        setContactPhone(settings.contactPhone)
        setAddress(settings.address)
        setNotifyNewOrders(settings.notifyNewOrders)
        setNotifyLowStock(settings.notifyLowStock)
        setNotifyCancellations(settings.notifyCancellations)
        setSidebarOpenDefault(settings.sidebarOpenDefault)
      } catch (err) {
        if (active) setError(err.message || 'Could not load settings')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const setTab = (next) => {
    setParams(next === 'profile' ? {} : { tab: next })
    setMessage('')
    setError('')
  }

  const runSave = async (action, successMessage) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
    } catch (err) {
      setError(err.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = (event) => {
    event.preventDefault()
    runSave(() => onSaveProfile({ name, phone, businessName: user?.businessName || '' }), 'Profile updated.')
  }

  const handleSaveStore = (event) => {
    event.preventDefault()
    runSave(async () => {
      await updateStoreInfo({ storeName, contactEmail, contactPhone, address })
    }, 'Store information saved.')
  }

  const handleSaveNotifications = (event) => {
    event.preventDefault()
    runSave(
      () =>
        updateNotificationSettings({
          notifyNewOrders,
          notifyLowStock,
          notifyCancellations,
        }),
      'Notification preferences saved.',
    )
  }

  const handleSavePreferences = (event) => {
    event.preventDefault()
    runSave(async () => {
      await updateAppPreferences({ sidebarOpenDefault })
      saveState('adminSidebarOpen', sidebarOpenDefault)
      setSidebarOpen?.(sidebarOpenDefault)
    }, 'App preferences saved.')
  }

  const handleChangePassword = (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setMessage('')
      return
    }
    runSave(async () => {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }, 'Password changed successfully.')
  }

  return (
    <section className="settings-page">
      <div className="settings-head">
        <div>
          <h2>Settings</h2>
          <p>Manage your admin account, store details, and preferences.</p>
        </div>
        <Link to="/admin/dashboard" className="profile-back">
          ← Back to dashboard
        </Link>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {loading ? <p className="settings-loading">Loading settings…</p> : null}

      {!loading && tab === 'profile' ? (
        <form className="settings-panel" onSubmit={handleSaveProfile}>
          <div className="settings-panel__intro">
            <h3>Profile</h3>
            <p>Update the name and phone shown on your admin account.</p>
          </div>
          <div className="profile-fields">
            <div className="field">
              <label htmlFor="settingsName">FULL NAME</label>
              <input
                id="settingsName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="settingsEmail">EMAIL</label>
              <input id="settingsEmail" value={user?.email || ''} disabled />
              <small className="field-hint">Email is tied to your login and cannot be changed here.</small>
            </div>
            <div className="field">
              <label htmlFor="settingsPhone">PHONE</label>
              <input
                id="settingsPhone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0912-345-6789"
              />
            </div>
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            {onLogout ? (
              <button type="button" className="btn-ghost profile-signout" onClick={onLogout}>
                Sign out
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {!loading && tab === 'store' ? (
        <form className="settings-panel" onSubmit={handleSaveStore}>
          <div className="settings-panel__intro">
            <h3>Store information</h3>
            <p>Contact details used for wholesale admin operations.</p>
          </div>
          <div className="profile-fields">
            <div className="field">
              <label htmlFor="storeName">STORE NAME</label>
              <input
                id="storeName"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="storeEmail">CONTACT EMAIL</label>
              <input
                id="storeEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="orders@quinto.store"
              />
            </div>
            <div className="field">
              <label htmlFor="storePhone">CONTACT PHONE</label>
              <input
                id="storePhone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="0912-345-6789"
              />
            </div>
            <div className="field">
              <label htmlFor="storeAddress">ADDRESS</label>
              <textarea
                id="storeAddress"
                rows={3}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street, city, province"
              />
            </div>
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Saving…' : 'Save store info'}
            </button>
          </div>
        </form>
      ) : null}

      {!loading && tab === 'notifications' ? (
        <form className="settings-panel" onSubmit={handleSaveNotifications}>
          <div className="settings-panel__intro">
            <h3>Notification preferences</h3>
            <p>Choose which admin alerts you want to receive.</p>
          </div>
          <div className="settings-toggles">
            <Toggle
              id="notifyOrders"
              label="New orders"
              description="Alert when a customer places an order."
              checked={notifyNewOrders}
              onChange={(event) => setNotifyNewOrders(event.target.checked)}
            />
            <Toggle
              id="notifyStock"
              label="Low stock"
              description="Alert when inventory drops to low levels."
              checked={notifyLowStock}
              onChange={(event) => setNotifyLowStock(event.target.checked)}
            />
            <Toggle
              id="notifyCancel"
              label="Cancellations"
              description="Alert when an order is cancelled."
              checked={notifyCancellations}
              onChange={(event) => setNotifyCancellations(event.target.checked)}
            />
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Saving…' : 'Save notifications'}
            </button>
          </div>
        </form>
      ) : null}

      {!loading && tab === 'security' ? (
        <form className="settings-panel" onSubmit={handleChangePassword}>
          <div className="settings-panel__intro">
            <h3>Security</h3>
            <p>Change your admin password. You’ll stay signed in after updating.</p>
          </div>
          <div className="profile-fields">
            <div className="field">
              <label htmlFor="currentPassword">CURRENT PASSWORD</label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="newPassword">NEW PASSWORD</label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      ) : null}

      {!loading && tab === 'preferences' ? (
        <form className="settings-panel" onSubmit={handleSavePreferences}>
          <div className="settings-panel__intro">
            <h3>App preferences</h3>
            <p>Control how the admin console behaves by default.</p>
          </div>
          <div className="settings-toggles">
            <Toggle
              id="sidebarDefault"
              label="Show sidebar by default"
              description="Open the admin sidebar when you return to the console."
              checked={sidebarOpenDefault}
              onChange={(event) => setSidebarOpenDefault(event.target.checked)}
            />
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-orange" disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

export default AdminSettingsPage
