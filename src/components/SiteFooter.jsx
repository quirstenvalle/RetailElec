import { Link } from 'react-router-dom'
import { assets } from '../constants/assets'
import { wholesaleCategories } from '../data/systemData'
import { footerContact, footerSocial } from '../data/footerContent'

const socialIcons = {
  globe: assets.iconGlobe,
  share: assets.iconShare,
  link: assets.iconLink,
}

function SiteFooter({ onSelectCategory }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>Quinto Store</h3>
          <p className="blurb">
            The preferred wholesale partner for thousands of businesses across the region. Reliable
            supply, competitive pricing, and quality service since 1995.
          </p>
          <div className="footer-social">
            {footerSocial.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
              >
                <img src={socialIcons[item.icon]} alt="" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4>PRODUCTS</h4>
          <ul>
            {wholesaleCategories.map((category) => (
              <li key={category}>
                <Link
                  to={`/categories?category=${encodeURIComponent(category)}`}
                  onClick={() => onSelectCategory?.(category)}
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>RESOURCES</h4>
          <ul>
            <li>
              <Link to="/info/shipping">Shipping Information</Link>
            </li>
            <li>
              <Link to="/info/returns">Returns &amp; Refunds</Link>
            </li>
            <li>
              <Link to="/info/faq">Wholesale FAQ</Link>
            </li>
            <li>
              <Link to="/info/merchant">Merchant Portal</Link>
            </li>
            <li>
              <Link to="/info/locations">Store Locator</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>CONTACT</h4>
          <ul className="footer-contact">
            <li>
              <a href={footerContact.phoneHref}>{footerContact.phone}</a>
            </li>
            <li>
              <a href={footerContact.emailHref}>{footerContact.email}</a>
            </li>
            <li>
              <a href={footerContact.salesEmailHref}>Wholesale sales desk</a>
            </li>
            <li>
              <a href={footerContact.mapsHref} target="_blank" rel="noreferrer">
                {footerContact.address}
              </a>
            </li>
            <li>{footerContact.hours}</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2024 Quinto Store Wholesale Group. Built for Entrepreneurs</span>
        <div className="footer-bottom-links">
          <Link to="/legal/privacy">Privacy Policy</Link>
          <Link to="/legal/terms">Terms of Use</Link>
          <Link to="/legal/cookies">Cookie Settings</Link>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
