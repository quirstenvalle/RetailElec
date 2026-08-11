import { useMemo, useState } from 'react'
import { assets } from '../../constants/assets'
import { toCurrency } from '../../utils/formatters'

function stockStatus(stock) {
  const qty = Number(stock) || 0
  if (qty <= 0) return { label: 'Out of Stock', tone: 'danger' }
  if (qty <= 10) return { label: 'Low Stock', tone: 'warn' }
  return { label: 'In Stock', tone: 'ok' }
}

function displayCategoryFor(category) {
  if (!category) return 'GENERAL'
  if (category === 'Canned Goods') return 'CAN GOODS'
  return String(category).toUpperCase()
}

function AdminInventoryPage({ categories, inventory, onAddInventoryProduct }) {
  const [mode, setMode] = useState('list')
  const [activeCategory, setActiveCategory] = useState('All Categories')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState(assets.productFlour)

  const visibleProducts = useMemo(() => {
    return activeCategory === 'All Categories'
      ? inventory
      : inventory.filter((item) => item.category === activeCategory)
  }, [activeCategory, inventory])

  const openAddForm = () => {
    setError('')
    setImagePreview(assets.productFlour)
    setMode('add')
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const formData = new FormData(event.currentTarget)
    const category = String(formData.get('category') || '')
    try {
      await onAddInventoryProduct({
        id: String(formData.get('serial') || '').trim() || undefined,
        name: formData.get('name'),
        category,
        displayCategory: displayCategoryFor(category),
        unitPrice: Number(formData.get('unitPrice')),
        piecePrice: Number(formData.get('unitPrice')),
        packLabel: '1 box',
        unitWeight: 'N/A',
        stock: Number(formData.get('stock')),
        image: imagePreview || assets.productFlour,
        description: String(formData.get('description') || ''),
      })
      setMode('list')
      event.currentTarget.reset()
    } catch (err) {
      setError(err.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'add') {
    return (
      <section className="admin-page inventory-page">
        <div className="inventory-form-head">
          <div>
            <button type="button" className="order-back" onClick={() => setMode('list')}>
              ← Back to Inventory
            </button>
            <h2>Add Product</h2>
            <p>Create a new wholesale item for your catalog.</p>
          </div>
        </div>

        <form className="inventory-add-card" onSubmit={handleSubmit}>
          <div className="inventory-add-grid">
            <div className="inventory-add-fields">
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
                  <input id="serial" name="serial" placeholder="PR-100200" />
                </div>
                <div className="field">
                  <label htmlFor="unitPrice">UNIT PRICE (₱)</label>
                  <div className="prefixed-input">
                    <span>₱</span>
                    <input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="stock">INITIAL QUANTITY</label>
                  <input id="stock" name="stock" type="number" min="0" required defaultValue={0} />
                </div>
              </div>

              <div className="field">
                <label htmlFor="description">PRODUCT DESCRIPTION</label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  placeholder="Detail the product features, materials, and handling instructions..."
                />
              </div>
            </div>

            <div className="upload-panel">
              <label htmlFor="productImage">UPLOAD PRODUCT IMAGE</label>
              <label className="upload-drop" htmlFor="productImage">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="upload-preview" />
                ) : (
                  <>
                    <span className="upload-icon" />
                    <p>Click to upload or drag</p>
                  </>
                )}
              </label>
              <input
                id="productImage"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setMode('list')} disabled={saving}>
              CANCEL
            </button>
            <button type="submit" className="btn-green save-product-btn" disabled={saving}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 3h12l2 2v16H5V3z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M8 3v6h8V3M8 21v-7h8v7" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {saving ? 'SAVING…' : 'SAVE PRODUCT'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <section className="admin-page inventory-page">
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
        <button type="button" className="btn-green" onClick={openAddForm}>
          + Add Product
        </button>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="empty-state inventory-empty">
          No products yet. Click “+ Add Product” to create your first item.
        </div>
      ) : (
        <div className="inventory-grid">
          {visibleProducts.map((product) => {
            const status = stockStatus(product.stock)
            return (
              <article key={product.id} className="inventory-card">
                <div className="thumb">
                  <img src={product.image} alt={product.name} />
                  <span className={`stock-badge ${status.tone}`}>{status.label}</span>
                </div>
                <div className="body">
                  <p className="category">{product.displayCategory || displayCategoryFor(product.category)}</p>
                  <h4>{product.name}</h4>
                  <div className="inventory-meta">
                    <strong>{toCurrency(product.unitPrice)}</strong>
                    <span>Qty: {String(product.stock).padStart(2, '0')}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AdminInventoryPage
