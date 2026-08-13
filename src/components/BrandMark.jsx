import { assets } from '../constants/assets'

function BrandMark({
  as: Tag = 'div',
  compact = false,
  showName = false,
  name = 'Quinto Store',
}) {
  return (
    <Tag className={`brand-block${compact ? ' compact' : ''}${showName ? ' with-name' : ''}`}>
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
