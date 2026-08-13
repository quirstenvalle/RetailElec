import { Link, useParams } from 'react-router-dom'
import { assets } from '../../constants/assets'
import { legalPages, resourcePages } from '../../data/footerContent'
import { loadState, saveState } from '../../utils/storage'
import { useState } from 'react'

function ContentPage({ source }) {
  const { slug } = useParams()
  const page = source[slug]
  const [prefs, setPrefs] = useState(() =>
    loadState('cookiePrefs', { essential: true, preferences: true }),
  )
  const [saved, setSaved] = useState(false)

  if (!page) {
    return (
      <section className="content-page">
        <h1>Page not found</h1>
        <p>The page you requested is unavailable.</p>
        <Link to="/home" className="btn-orange">
          Back to shop
        </Link>
      </section>
    )
  }

  const saveCookiePrefs = (event) => {
    event.preventDefault()
    const next = {
      essential: true,
      preferences: Boolean(event.currentTarget.preferences.checked),
    }
    saveState('cookiePrefs', next)
    setPrefs(next)
    setSaved(true)
  }

  return (
    <section className="content-page">
      <div className="content-hero">
        <p className="content-kicker">Quinto Store</p>
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="content-body">
        {page.sections.map((section) => (
          <article key={section.heading} className="content-block">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}

        {page.showMap ? (
          <div className="content-map">
            <img src={assets.mapLocation} alt="Store location map" />
            <a className="btn-orange" href={page.mapsHref} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          </div>
        ) : null}

        {page.cookieControls ? (
          <form className="cookie-form" onSubmit={saveCookiePrefs}>
            <label className="check-row">
              <input type="checkbox" checked disabled readOnly />
              <span>Essential cookies (required)</span>
            </label>
            <label className="check-row">
              <input name="preferences" type="checkbox" defaultChecked={prefs.preferences} />
              <span>Preference cookies</span>
            </label>
            {saved ? <p className="form-success">Cookie preferences saved on this device.</p> : null}
            <button type="submit" className="btn-orange">
              Save cookie settings
            </button>
          </form>
        ) : null}

        {page.cta ? (
          <Link to={page.cta.to} className="btn-orange content-cta">
            {page.cta.label}
          </Link>
        ) : (
          <Link to="/home" className="link-orange">
            ← Back to shop
          </Link>
        )}
      </div>
    </section>
  )
}

export function ResourcePage() {
  return <ContentPage source={resourcePages} />
}

export function LegalPage() {
  return <ContentPage source={legalPages} />
}
