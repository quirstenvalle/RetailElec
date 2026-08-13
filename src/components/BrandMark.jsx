import { Link } from 'react-router-dom'
import { assets } from '../constants/assets'

function BrandMark({
  as,
  to,
  compact = false,
  showName = false,
  name = 'Quinto Store',
}) {
  const Tag = to ? Link : as || 'div'
  const linkProps = to ? { to, title: name, 'aria-label': `Go to ${name} home` } : {}

  return (
    <Tag
      className={`brand-block${compact ? ' compact' : ''}${showName ? ' with-name' : ''}${to ? ' is-link' : ''}`}
      {...linkProps}
    >
      <img className="brand-logo" src={assets.brandLogo} alt={name} />
      {showName ? (
        <div className="brand-copy">
          <strong>{name}</strong>
        </div>
      ) : null}
    </Tag>
  )
}

export default BrandMark
