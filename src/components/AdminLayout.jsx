import { useLocation, NavLink, Outlet } from 'react-router-dom'
import { assets } from '../constants/assets'
import BrandMark from './BrandMark'

const links = [
  { to: '/admin/dashboard', label: 'DASHBOARD', title: 'ADMIN DASHBOARD' },
  { to: '/admin/customers', label: 'CUSTOMERS', title: 'CUSTOMER MANAGEMENT' },
  { to: '/admin/inventory', label: 'INVENTORY', title: 'PRODUCT INVENTORY' },
  { to: '/admin/orders', label: 'ORDERS', title: 'ORDER TRACKING' },
  { to: '/admin/report', label: 'REPORT', title: 'REPORT GENERATION' },
]

function AdminLayout() {
  const location = useLocation()
  const active = links.find((link) => location.pathname.startsWith(link.to)) || links[0]

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <BrandMark />
        <hr />
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h1>{active.title}</h1>
          <div className="header-icons">
            <button type="button" className="icon-btn icon-32" aria-label="Notifications">
              <img src={assets.iconBell} alt="" />
            </button>
            <button type="button" className="icon-btn icon-36" aria-label="Account">
              <img src={assets.iconAvatar} alt="" />
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </section>
  )
}

export default AdminLayout
