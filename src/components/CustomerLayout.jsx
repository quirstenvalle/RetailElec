import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../constants/assets'
import BrandMark from './BrandMark'
import HeaderActions from './HeaderActions'
import SiteFooter from './SiteFooter'

function CustomerLayout({
  categories,
  cartCount,
  activeCategory,
  onSelectCategory,
  onLogout,
  user,
}) {
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
          <HeaderActions user={user} onLogout={onLogout} profilePath="/profile" />
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
