import { useEffect, useState } from 'react'
import { useLocation, NavLink, Outlet } from 'react-router-dom'
import { assets } from '../constants/assets'
import { fetchStoreSettings } from '../api/settingsApi'
import HeaderActions from './HeaderActions'
import { usePersistedState } from '../hooks/usePersistedState'

const links = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    title: 'Admin Dashboard',
    icon: 'dashboard',
  },
  {
    to: '/admin/customers',
    label: 'Customers',
    title: 'Customer Management',
    icon: 'customers',
  },
  {
    to: '/admin/inventory',
    label: 'Inventory',
    title: 'Product Inventory',
    icon: 'inventory',
  },
  {
    to: '/admin/orders',
    label: 'Orders',
    title: 'Order Tracking',
    icon: 'orders',
  },
  {
    to: '/admin/report',
    label: 'Report',
    title: 'Report Generation',
    icon: 'report',
  },
]

function NavIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'customers':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.3" />
          <path d="M16.5 3.8a3.5 3.5 0 0 1 0 6.4" />
        </svg>
      )
    case 'inventory':
      return (
        <svg {...common}>
          <path d="M6 7h12l1 13H5L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      )
    case 'orders':
      return (
        <svg {...common}>
          <path d="M8 6h11v14H5V6h3" />
          <path d="M9 3h6v3H9z" />
          <path d="M9 11h6M9 15h4" />
        </svg>
      )
    case 'report':
      return (
        <svg {...common}>
          <path d="M5 19V9l4 3 4-6 4 4v9H5z" />
          <path d="M5 19h14" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'collapse':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      )
    default:
      return null
  }
}

function AdminLayout({ onLogout, user }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = usePersistedState('adminSidebarOpen', true)
  const [storeName, setStoreName] = useState("Arlen's Store")
  const active =
    location.pathname.startsWith('/admin/settings') || location.pathname.startsWith('/admin/profile')
      ? { title: 'Settings' }
      : links.find((link) => location.pathname.startsWith(link.to)) || links[0]

  useEffect(() => {
    let activeRequest = true
    fetchStoreSettings()
      .then((settings) => {
        if (activeRequest && settings?.storeName) setStoreName(settings.storeName)
      })
      .catch(() => {})
    return () => {
      activeRequest = false
    }
  }, [])

  return (
    <section className={`admin-shell${sidebarOpen ? '' : ' sidebar-hidden'}`}>
      <aside className="admin-sidebar" aria-hidden={!sidebarOpen}>
        <div className="admin-brand">
          <img className="brand-logo" src={assets.brandLogo} alt="MarketBulk Central Hub" />
          <p>Admin · {storeName}</p>
        </div>

        <nav className="admin-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} title={link.label}>
              <NavIcon name={link.icon} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <NavLink to="/admin/settings" title="Settings">
            <NavIcon name="settings" />
            <span>Settings</span>
          </NavLink>
          <button type="button" className="admin-logout" onClick={onLogout} title="Logout">
            <NavIcon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-edge-toggle"
          onClick={() => setSidebarOpen(false)}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <NavIcon name="collapse" />
        </button>
      ) : null}

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-pressed={sidebarOpen}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <NavIcon name="menu" />
            </button>
            <h1>{active.title}</h1>
          </div>
          <HeaderActions user={user} profilePath="/admin/settings?tab=profile" />
        </header>
        <div className="admin-content">
          <Outlet context={{ setSidebarOpen, setStoreName }} />
        </div>
      </div>
    </section>
  )
}

export default AdminLayout
