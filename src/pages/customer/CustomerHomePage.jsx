import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryTiles } from '../../data/systemData'
import { toCurrency } from '../../utils/formatters'
import {
  coercePricingUnit,
  defaultPricingUnit,
  isCannedGoodsCategory,
  priceForUnit,
  pricingUnitSuffix,
  unitToggleOptions,
} from '../../utils/pricingUnits'

const categoryAlias = {
  'Dry Goods': 'Dry Materials',
  Condiments: 'Canned Goods',
}

function CustomerHomePage({ featured, onAddToCart, onSelectCategory }) {
  const [units, setUnits] = useState({})

  return (
    <>
      <section className="hero-banner">
        <div>
          <h2>
            Quality Dry Goods
            <br />
            at Wholesale Prices
          </h2>
          <p>
            Keep your shelves stocked with trusted brands and affordable bulk pricing. We provide
            dependable wholesale supplies for businesses of all sizes.
          </p>
          <div className="hero-actions">
            <Link to="/categories" className="btn-orange hero-cta">
              Shop Now
            </Link>
            <Link to="/categories" className="btn-outline-light">
              View Categories
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block section-center">
        <h3>Hot Wholesale Deals</h3>
        <p>Save more on bulk essentials. Limited-time wholesale discounts.</p>
        <div className="deals-grid">
          {featured.map((item) => {
            const pricingUnit = coercePricingUnit(
              item.category,
              units[item.id] || defaultPricingUnit(item.category),
            )
            const canned = isCannedGoodsCategory(item.category)
            const price = priceForUnit(item, pricingUnit)
            const options = unitToggleOptions(item.category)
            return (
              <article key={item.id} className="deal-card">
                <img src={item.image} alt={item.name} />
                <div className="deal-card-body">
                  <div>
                    <h4>{item.name}</h4>
                    <p className="price">
                      {toCurrency(price)} {pricingUnitSuffix(pricingUnit)}
                    </p>
                    <div className="unit-toggle compact" role="group" aria-label={`Order unit for ${item.name}`}>
                      {options.map((option) => (
                        <button
                          key={option.unit}
                          type="button"
                          className={pricingUnit === option.unit ? 'active' : ''}
                          onClick={() => setUnits((prev) => ({ ...prev, [item.id]: option.unit }))}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="deal-unit-note">
                      {canned ? 'Piece or box' : 'Box or pack'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-green"
                    onClick={() => onAddToCart(item.id, 1, pricingUnit)}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <h3>Shop by Category</h3>
            <p>Everything you need to stock your business with quality wholesale essentials.</p>
          </div>
          <Link to="/categories">View All Categories →</Link>
        </div>
        <div className="category-mosaic">
          {categoryTiles.map((tile) => (
            <Link
              key={tile.name}
              to="/categories"
              className={`mosaic-tile${tile.large ? ' large' : ''}${tile.wide ? ' wide' : ''}`}
              onClick={() => onSelectCategory?.(categoryAlias[tile.name] || tile.name)}
            >
              <img src={tile.image} alt={tile.name} />
              <span>{tile.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

export default CustomerHomePage
