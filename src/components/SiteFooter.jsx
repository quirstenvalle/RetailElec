import { Link } from 'react-router-dom'
import { assets } from '../constants/assets'
import { wholesaleCategories } from '../data/systemData'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>Arlen Store</h3>
          <p className="blurb">
            The preferred wholesale partner for thousands of businesses across the region. Reliable
            supply, competitive pricing, and quality service since 1995.
          </p>
          <div className="footer-social">
            <span>
              <img src={assets.iconGlobe} alt="" />
            </span>
            <span>
              <img src={assets.iconShare} alt="" />
            </span>
            <span>
              <img src={assets.iconLink} alt="" />
            </span>
          </div>
        </div>

        <div>
          <h4>PRODUCTS</h4>
          <ul>
            {wholesaleCategories.map((category) => (
              <li key={category}>
                <Link to="/categories">{category}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>RESOURCES</h4>
          <ul>
            <li>Shipping Information</li>
            <li>Return & Refunds</li>
            <li>Wholesale FAQ</li>
            <li>Merchant Portal</li>
            <li>Store Locatore</li>
          </ul>
        </div>

        <div>
          <h4>CONTACT</h4>
          <ul>
            <li>Shipping Information</li>
            <li>Return & Refunds</li>
            <li>Wholesale FAQ</li>
            <li>Merchant Portal</li>
            <li>Store Locatore</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2024 Arlen&apos;s Store Wholesale Group. Built for Entrepreneurs</span>
        <div className="footer-bottom-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Term of User</a>
          <a href="#cookies">Cookie Setting</a>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
