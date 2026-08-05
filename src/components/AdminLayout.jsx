import { useLocation, NavLink, Outlet } from 'react-router-dom'
import BrandMark from './BrandMark'
import HeaderActions from './HeaderActions'

const links = [
  { to: '/admin/dashboard', label: 'DASHBOARD', title: 'ADMIN DASHBOARD' },
  { to: '/admin/customers', label: 'CUSTOMERS', title: 'CUSTOMER MANAGEMENT' },
  { to: '/admin/inventory', label: 'INVENTORY', title: 'PRODUCT INVENTORY' },
  { to: '/admin/orders', label: 'ORDERS', title: 'ORDER TRACKING' },
  { to: '/admin/report', label: 'REPORT', title: 'REPORT GENERATION' },
]

function AdminLayout({ onLogout, user }) {
  const location = useLocation()
  const active =
    location.pathname.startsWith('/admin/profile')
      ? { title: 'MY PROFILE' }
      : links.find((link) => location.pathname.startsWith(link.to)) || links[0]

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
          <HeaderActions user={user} onLogout={onLogout} profilePath="/admin/profile" />
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </section>
  )
}

export default AdminLayout
