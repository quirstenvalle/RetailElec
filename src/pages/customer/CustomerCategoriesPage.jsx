import { useMemo, useState } from 'react'
import QuantityStepper from '../../components/QuantityStepper'
import { toCurrency } from '../../utils/formatters'
import {
  coercePricingUnit,
  defaultPricingUnit,
  isCannedGoodsCategory,
  priceForUnit,
  pricingUnitLabel,
  unitToggleOptions,
} from '../../utils/pricingUnits'

function CustomerCategoriesPage({ products, categories, activeCategory, onAddToCart }) {
  const [quantities, setQuantities] = useState({})
  const [units, setUnits] = useState({})
  const selected = activeCategory || categories[0]

  const filteredProducts = useMemo(
    () => products.filter((item) => item.category === selected),
    [products, selected],
  )

  const heading = selected === 'Laundry Care' ? 'LAUNDRY' : selected.replace(' Materials', '').toUpperCase()
  const cannedOnly = isCannedGoodsCategory(selected)

  return (
    <section className="catalog-page">
      <h2 className="catalog-title">{heading}</h2>
      <p className="catalog-unit-note">
        {cannedOnly
          ? 'Canned goods can be bought per piece or per box.'
          : 'Items in this category can be bought per box or per pack.'}
      </p>
      <div className="catalog-list">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">No products in this category yet.</div>
        ) : (
          filteredProducts.map((item) => {
            const quantity = quantities[item.id] || 1
            const pricingUnit = coercePricingUnit(
              item.category,
              units[item.id] || defaultPricingUnit(item.category),
            )
            const activePrice = priceForUnit(item, pricingUnit)
            const options = unitToggleOptions(item.category)
            return (
              <article className="catalog-row" key={item.id}>
                <div className="catalog-thumb">
                  <img src={item.image} alt={item.name} />
                </div>
                <div>
                  <h3>{item.name}</h3>
                  <p className="pack">{item.packLabel}</p>
                  <div className="pricing-stack">
                    {options.map((option) => (
                      <p
                        key={option.unit}
                        className={`pricing-line${pricingUnit === option.unit ? ' selected' : ''}`}
                      >
                        <span>{pricingUnitLabel(option.unit)}</span>
                        <strong>{toCurrency(priceForUnit(item, option.unit))}</strong>
                      </p>
                    ))}
                  </div>
                  <div className="unit-toggle" role="group" aria-label={`Order unit for ${item.name}`}>
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
                  <p className="unit-active-price">
                    You pay: <strong>{toCurrency(activePrice)}</strong> {pricingUnitLabel(pricingUnit).toLowerCase()}
                  </p>
                </div>
                <div className="catalog-actions">
                  <QuantityStepper
                    value={quantity}
                    onChange={(next) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: next,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-green"
                    onClick={() => onAddToCart(item.id, quantity, pricingUnit)}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default CustomerCategoriesPage
