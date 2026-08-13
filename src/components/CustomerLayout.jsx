import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { assets } from '../constants/assets'
import { usePersistedState } from '../hooks/usePersistedState'
import BrandMark from './BrandMark'
import HeaderActions from './HeaderActions'
import SiteFooter from './SiteFooter'

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function CustomerLayout({
  categories,
  cartCount,
  activeCategory,
  onSelectCategory,
  onLogout,
  user,
}) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = usePersistedState('customerSidebarOpen', true)

  useEffect(() => {
    const fromQuery = params.get('category')
    if (fromQuery && categories.includes(fromQuery) && fromQuery !== activeCategory) {
      onSelectCategory?.(fromQuery)
    }
  }, [params, categories, activeCategory, onSelectCategory])

  const selectCategory = (category) => {
    onSelectCategory?.(category)
    navigate(`/categories?category=${encodeURIComponent(category)}`)
  }

  return (
    <section className={`customer-shell${sidebarOpen ? '' : ' sidebar-hidden'}`}>
      <aside className="customer-sidebar" aria-hidden={!sidebarOpen}>
        <BrandMark />
        <hr className="sidebar-divider" />
        <h3>CATEGORIES</h3>
        <ul>
          {categories.map((category) => (
            <li key={category}>
              <button
                type="button"
                className={activeCategory === category ? 'active' : ''}
                onClick={() => selectCategory(category)}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-edge-toggle customer-edge-toggle"
          onClick={() => setSidebarOpen(false)}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <CollapseIcon />
        </button>
      ) : null}

      {sidebarOpen ? (
        <button
          type="button"
          className="customer-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="customer-main">
        <header className="customer-header">
          <div className="customer-header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-pressed={sidebarOpen}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <MenuIcon />
            </button>
            <div className="header-search">
              <img src={assets.iconSearch} alt="" />
              <input type="search" placeholder="Search wholesale products" />
            </div>
          </div>
          <nav className="header-nav">
            <NavLink to="/home">SALE!</NavLink>
            <NavLink to="/categories">CATEGORY</NavLink>
            <NavLink to="/cart" className="cart-link">
              <img src={assets.iconCart} alt="" className="icon-36" />
              CART{cartCount > 0 ? ` (${cartCount})` : ''}
            </NavLink>
          </nav>
          <HeaderActions user={user} profilePath="/profile" />
        </header>

        <div className="page-content">
          <Outlet />
        </div>
        <SiteFooter onSelectCategory={onSelectCategory} />
      </div>
    </section>
  )
}

export default CustomerLayout
