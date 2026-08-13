import { assets } from '../constants/assets'

function BrandMark({ as: Tag = 'div', compact = false }) {
  return (
    <Tag className={`brand-block${compact ? ' compact' : ''}`}>
      <img className="brand-logo" src={assets.brandLogo} alt="MarketBulk Central Hub" />
    </Tag>
  )
}

export default BrandMark
