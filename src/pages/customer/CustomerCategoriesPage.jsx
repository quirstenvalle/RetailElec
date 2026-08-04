import { useMemo, useState } from 'react'
import QuantityStepper from '../../components/QuantityStepper'
import { toCurrency } from '../../utils/formatters'

function CustomerCategoriesPage({ products, categories, activeCategory, onAddToCart }) {
  const [quantities, setQuantities] = useState({})
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
            const quantity = quantities[item.id] || 10
            return (
              <article className="catalog-row" key={item.id}>
                <div className="catalog-thumb">
                  <img src={item.image} alt={item.name} />
                </div>
                <div>
                  <h3>{item.name}</h3>
                  <p className="pack">{item.packLabel}</p>
                  <p className="pricing">
                    {toCurrency(item.unitPrice)}/ box
                    <br />
                    {toCurrency(item.piecePrice)}/ pc
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
                    onClick={() => onAddToCart(item.id, quantity)}
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
