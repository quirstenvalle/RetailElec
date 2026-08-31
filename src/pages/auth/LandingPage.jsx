import { Link } from 'react-router-dom'
import { assets } from '../../constants/assets'
import { landingPromotions } from '../../data/landingContent'

const promoIcons = {
  points: '★',
  raffle: '♙',
  discounts: '%',
}

const features = [
  {
    title: 'Wholesale pricing',
    body: 'Bulk rates on dry goods, canned goods, condiments, and snacks for merchants and resellers.',
  },
  {
    title: 'Order tracking',
    body: 'Follow every purchase from checkout to pickup or delivery with live status updates.',
  },
  {
    title: 'Flexible payments',
    body: 'Pay online via card or e-wallet, or choose cash on delivery for approved accounts.',
  },
]

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="Quinto Store home">
          <img src={assets.brandMark} alt="" className="landing-brand-mark" />
          <span>Quinto Store</span>
        </Link>
        <nav className="landing-nav">
          <Link to="/login" className="landing-nav-link">
            Sign In
          </Link>
          <Link to="/register" className="btn-green landing-nav-cta">
            Register
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">Wholesale marketplace</p>
            <h1>
              Stock your business with
              <br />
              trusted bulk supplies
            </h1>
            <p>
              Quinto Store connects merchants to dependable wholesale inventory, competitive pricing,
              and a streamlined ordering experience built for growing businesses.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn-orange landing-hero-btn">
                Create merchant account
              </Link>
              <Link to="/login" className="btn-outline-light landing-hero-btn">
                Sign in to shop
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual landing-hero-visual--motion" aria-hidden="true">
            <img src={assets.landingHeroMotion} alt="" className="landing-hero-motion-img" />
          </div>
        </section>

        <section className="landing-promotions" aria-labelledby="landing-promotions-title">
          <div className="landing-promotions-head">
            <p className="landing-kicker">Promotions</p>
            <h2 id="landing-promotions-title">Rewards that grow with your business</h2>
            <p>
              Register as a merchant to unlock points, join monthly raffles, and access wholesale
              discounts on every order.
            </p>
          </div>
          <div className="landing-promo-grid">
            {landingPromotions.map((promo) => (
              <article key={promo.id} className={`landing-promo-card landing-promo-card--${promo.accent}`}>
                <div className="landing-promo-card__top">
                  <span className="landing-promo-icon" aria-hidden="true">
                    {promoIcons[promo.accent]}
                  </span>
                  <span className="landing-promo-badge">{promo.badge}</span>
                </div>
                <h3>{promo.title}</h3>
                <p>{promo.body}</p>
                <ul className="landing-promo-highlights">
                  {promo.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="landing-promo-cta">
            <Link to="/register" className="btn-orange landing-hero-btn">
              Register to unlock promotions
            </Link>
            <Link to="/login" className="btn-green landing-hero-btn">
              Sign in to My Rewards
            </Link>
          </div>
        </section>

        <section className="landing-features">
          <h2>Built for wholesale buyers</h2>
          <p>Everything you need to browse, order, and manage supplies in one place.</p>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="landing-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2>Ready to place your first order?</h2>
          <p>Register your business account and start browsing wholesale categories today.</p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn-orange landing-hero-btn">
              Get started
            </Link>
            <Link to="/login" className="btn-green landing-hero-btn">
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Quinto Store Wholesale Group</span>
      </footer>
    </div>
  )
}

export default LandingPage
