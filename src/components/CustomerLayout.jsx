import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../constants/assets'
import BrandMark from './BrandMark'
import SiteFooter from './SiteFooter'

function CustomerLayout({ categories, cartCount, activeCategory, onSelectCategory }) {
  const navigate = useNavigate()

  return (
    <section className="customer-shell">
      <aside className="customer-sidebar">
        <BrandMark />
        <hr className="sidebar-divider" />
        <h3>CATEGORIES</h3>
        <ul>
          {categories.map((category) => (
            <li key={category}>
              <button
                type="button"
                className={activeCategory === category ? 'active' : ''}
                onClick={() => {
                  onSelectCategory?.(category)
                  navigate('/categories')
                }}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="customer-main">
        <header className="customer-header">
          <div className="header-search">
            <img src={assets.iconSearch} alt="" />
            <input type="search" placeholder="Search wholesale products" />
          </div>
          <nav className="header-nav">
            <NavLink to="/home">SALE!</NavLink>
            <NavLink to="/categories">CATEGORY</NavLink>
            <NavLink to="/cart" className="cart-link">
              <img src={assets.iconCart} alt="" className="icon-36" />
              CART{cartCount > 0 ? ` (${cartCount})` : ''}
            </NavLink>
          </nav>
          <div className="header-icons">
            <button type="button" className="icon-btn icon-32" aria-label="Notifications">
              <img src={assets.iconBell} alt="" />
            </button>
            <button type="button" className="icon-btn icon-36" aria-label="Account">
              <img src={assets.iconAvatar} alt="" />
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
        <SiteFooter />
      </div>
    </section>
  )
}

export default CustomerLayout
