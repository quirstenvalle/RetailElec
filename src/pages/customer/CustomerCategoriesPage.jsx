import { useMemo, useState } from 'react'
import QuantityStepper from '../../components/QuantityStepper'
import { toCurrency } from '../../utils/formatters'

function CustomerCategoriesPage({ products, categories, activeCategory, onAddToCart }) {
  const [quantities, setQuantities] = useState({})
  const [units, setUnits] = useState({})
  const selected = activeCategory || categories[0]

  const filteredProducts = useMemo(
    () => products.filter((item) => item.category === selected),
    [products, selected],
  )

  const heading = selected === 'Laundry Care' ? 'LAUNDRY' : selected.replace(' Materials', '').toUpperCase()

  return (
    <section className="catalog-page">
      <h2 className="catalog-title">{heading}</h2>
      <div className="catalog-list">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">No products in this category yet.</div>
        ) : (
          filteredProducts.map((item) => {
            const quantity = quantities[item.id] || 1
            const hasPiecePrice = Number(item.piecePrice) > 0
            const pricingUnit = units[item.id] || 'box'
            const activePrice = pricingUnit === 'piece' ? item.piecePrice : item.unitPrice
            return (
              <article className="catalog-row" key={item.id}>
                <div className="catalog-thumb">
                  <img src={item.image} alt={item.name} />
                </div>
                <div>
                  <h3>{item.name}</h3>
                  <p className="pack">{item.packLabel}</p>
                  <div className="pricing-stack">
                    <p className={`pricing-line${pricingUnit === 'box' ? ' selected' : ''}`}>
                      <span>Per box</span>
                      <strong>{toCurrency(item.unitPrice)}</strong>
                    </p>
                    <p className={`pricing-line${pricingUnit === 'piece' ? ' selected' : ''}`}>
                      <span>Per piece</span>
                      <strong>{hasPiecePrice ? toCurrency(item.piecePrice) : 'Not set'}</strong>
                    </p>
                  </div>
                  <div className="unit-toggle" role="group" aria-label={`Order unit for ${item.name}`}>
                    <button
                      type="button"
                      className={pricingUnit === 'box' ? 'active' : ''}
                      onClick={() => setUnits((prev) => ({ ...prev, [item.id]: 'box' }))}
                    >
                      Per box
                    </button>
                    <button
                      type="button"
                      className={pricingUnit === 'piece' ? 'active' : ''}
                      disabled={!hasPiecePrice}
                      title={hasPiecePrice ? 'Use piece price' : 'Admin has not set a piece price'}
                      onClick={() => setUnits((prev) => ({ ...prev, [item.id]: 'piece' }))}
                    >
                      Per piece
                    </button>
                  </div>
                  <p className="unit-active-price">
                    You pay: <strong>{toCurrency(activePrice)}</strong>{' '}
                    {pricingUnit === 'piece' ? 'per piece' : 'per box'}
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
