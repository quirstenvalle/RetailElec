import { useState } from 'react'
import { assets } from '../../constants/assets'
import { toCurrency } from '../../utils/formatters'

function AdminInventoryPage({ categories, inventory, onAddInventoryProduct }) {
  const [showModal, setShowModal] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All Categories')

  const visibleProducts =
    activeCategory === 'All Categories'
      ? inventory
      : inventory.filter((item) => item.category === activeCategory)

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onAddInventoryProduct({
      name: formData.get('name'),
      category: formData.get('category'),
      displayCategory:
        formData.get('category') === 'Canned Goods' ? 'CAN GOODS' : 'DRY GOODS',
      unitPrice: Number(formData.get('unitPrice')),
      piecePrice: Number(formData.get('unitPrice')),
      packLabel: '1 box',
      unitWeight: 'N/A',
      stock: Number(formData.get('stock')),
      image: assets.productFlour,
    })
    setShowModal(false)
    event.currentTarget.reset()
  }

  return (
    <section className="admin-page">
      <div className="admin-toolbar">
        <select
          className="filter-input category-select"
          value={activeCategory}
          onChange={(event) => setActiveCategory(event.target.value)}
        >
          <option>All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button type="button" className="btn-green" onClick={() => setShowModal(true)}>
          Add Product +
        </button>
      </div>

      <div className="inventory-grid">
        {visibleProducts.map((product) => (
          <article key={product.id} className="inventory-card">
            <div className="thumb">
              <img src={product.image} alt={product.name} />
              <span className="stock-badge">In Stock</span>
            </div>
            <div className="body">
              <p className="category">{product.displayCategory || product.category}</p>
              <h4>{product.name}</h4>
              <div className="inventory-meta">
                <strong>{toCurrency(product.unitPrice)}</strong>
                <span>Qty: {String(product.stock).padStart(2, '0')}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showModal ? (
        <div className="modal-backdrop">
          <form className="modal-card add-product-modal" onSubmit={handleSubmit}>
            <div className="modal-main">
              <div className="modal-fields">
                <div className="field">
                  <label htmlFor="name">PRODUCT NAME</label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Organic Fair Trade Coffee Beans"
                  />
                </div>
                <div className="modal-grid">
                  <div className="field">
                    <label htmlFor="category">CATEGORY</label>
                    <select id="category" name="category" required defaultValue="">
                      <option value="" disabled>
                        Select Category
                      </option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="serial">PRODUCT SERIAL NUMBER</label>
                    <input id="serial" name="serial" defaultValue="PR-100200" />
                  </div>
                  <div className="field">
                    <label htmlFor="unitPrice">UNIT PRICE ($)</label>
                    <div className="prefixed-input">
                      <span>$</span>
                      <input id="unitPrice" name="unitPrice" type="number" min="1" step="0.01" required placeholder="0.00" />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="stock">INITIAL QUANTITY</label>
                    <input id="stock" name="stock" type="number" min="1" required placeholder="0" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="description">PRODUCT DESCRIPTION</label>
                  <textarea
                    id="description"
                    rows="5"
                    placeholder="Detail the product features, materials, and handling instructions..."
                  />
                </div>
              </div>

              <div className="upload-panel">
                <label>UPLOAD PRODUCT IMAGE</label>
                <div className="upload-drop">
                  <span className="upload-icon" />
                  <p>Click to upload or drag</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                CANCEL
              </button>
              <button type="submit" className="btn-green">
                SAVE PRODUCT
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default AdminInventoryPage
