import { useMemo, useState } from 'react'
import { assets } from '../../constants/assets'
import { toCurrency } from '../../utils/formatters'
import { isCannedGoodsCategory } from '../../utils/pricingUnits'

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

function ProductForm({
  title,
  subtitle,
  categories,
  initial,
  imagePreview,
  onImageChange,
  saving,
  error,
  onCancel,
  onSubmit,
}) {
  const [category, setCategory] = useState(initial?.category || '')
  const canned = isCannedGoodsCategory(category)

  return (
    <section className="admin-page inventory-page">
      <div className="inventory-form-head">
        <div>
          <button type="button" className="order-back" onClick={onCancel}>
            ← Back to Inventory
          </button>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <form className="inventory-add-card" onSubmit={onSubmit}>
        <div className="inventory-add-grid">
          <div className="inventory-add-fields">
            <div className="field">
              <label htmlFor="name">PRODUCT NAME</label>
              <input
                id="name"
                name="name"
                required
                defaultValue={initial?.name || ''}
                placeholder="e.g. Organic Fair Trade Coffee Beans"
              />
            </div>

            <div className="modal-grid">
              <div className="field">
                <label htmlFor="category">CATEGORY</label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <small className="field-hint">
                  {canned
                    ? 'Canned goods: customers choose per piece or per box.'
                    : 'Other categories: customers choose per box or per pack.'}
                </small>
              </div>
              <div className="field">
                <label htmlFor="serial">PRODUCT SERIAL NUMBER</label>
                <input
                  id="serial"
                  name="serial"
                  defaultValue={initial?.id || ''}
                  placeholder="PR-100200"
                  disabled={Boolean(initial?.id)}
                  readOnly={Boolean(initial?.id)}
                />
                {initial?.id ? (
                  <small className="field-hint">Serial ID cannot be changed after creation.</small>
                ) : null}
              </div>
              {canned ? (
                <>
                  <div className="field" key="canned-piece">
                    <label htmlFor="piecePrice">PIECE PRICE (₱)</label>
                    <div className="prefixed-input">
                      <span>₱</span>
                      <input
                        id="piecePrice"
                        name="piecePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={
                          initial?.piecePrice != null && Number(initial.piecePrice) > 0
                            ? initial.piecePrice
                            : ''
                        }
                        placeholder="e.g. 45.00"
                      />
                    </div>
                  </div>
                  <div className="field" key="canned-box">
                    <label htmlFor="unitPrice">BOX PRICE (₱)</label>
                    <div className="prefixed-input">
                      <span>₱</span>
                      <input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={initial?.unitPrice ?? ''}
                        placeholder="0.00"
                      />
                    </div>
                    <input type="hidden" name="packPrice" defaultValue={0} />
                  </div>
                </>
              ) : (
                <>
                  <div className="field" key="box-price">
                    <label htmlFor="unitPrice">BOX PRICE (₱)</label>
                    <div className="prefixed-input">
                      <span>₱</span>
                      <input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={initial?.unitPrice ?? ''}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="field" key="pack-price">
                    <label htmlFor="packPrice">PACK PRICE (₱)</label>
                    <div className="prefixed-input">
                      <span>₱</span>
                      <input
                        id="packPrice"
                        name="packPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={
                          initial?.packPrice != null && Number(initial.packPrice) > 0
                            ? initial.packPrice
                            : ''
                        }
                        placeholder="e.g. 120.00"
                      />
                    </div>
                    <input type="hidden" name="piecePrice" defaultValue={0} />
                  </div>
                </>
              )}
              <div className="field">
                <label htmlFor="stock">{initial ? 'STOCK QUANTITY' : 'INITIAL QUANTITY'}</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  defaultValue={initial?.stock ?? 0}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">PRODUCT DESCRIPTION</label>
              <textarea
                id="description"
                name="description"
                rows="5"
                defaultValue={initial?.description || ''}
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
              onChange={onImageChange}
            />
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
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
            {saving ? 'SAVING…' : initial ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'}
          </button>
        </div>
      </form>
    </section>
  )
}

function AdminInventoryPage({
  categories,
  inventory,
  onAddInventoryProduct,
  onUpdateInventoryProduct,
  onDeleteInventoryProduct,
}) {
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All Categories')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState(assets.productFlour)
  const [deletingId, setDeletingId] = useState(null)

  const visibleProducts = useMemo(() => {
    return activeCategory === 'All Categories'
      ? inventory
      : inventory.filter((item) => item.category === activeCategory)
  }, [activeCategory, inventory])

  const resetToList = () => {
    setMode('list')
    setEditing(null)
    setError('')
    setSaving(false)
    setImagePreview(assets.productFlour)
  }

  const openAddForm = () => {
    setEditing(null)
    setError('')
    setImagePreview(assets.productFlour)
    setMode('form')
  }

  const openEditForm = (product) => {
    setEditing(product)
    setError('')
    setImagePreview(product.image || assets.productFlour)
    setMode('form')
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
    const canned = isCannedGoodsCategory(category)
    const unitPrice = Number(formData.get('unitPrice'))
    const piecePrice = Number(formData.get('piecePrice'))
    const packPrice = Number(formData.get('packPrice'))

    if (!(unitPrice >= 0) || Number.isNaN(unitPrice)) {
      setError('Enter a valid box price.')
      setSaving(false)
      return
    }

    if (canned) {
      if (!(piecePrice > 0) || Number.isNaN(piecePrice)) {
        setError('Enter a valid piece price for canned goods.')
        setSaving(false)
        return
      }
    } else if (!(packPrice > 0) || Number.isNaN(packPrice)) {
      setError('Enter a valid pack price.')
      setSaving(false)
      return
    }

    const payload = {
      id: editing?.id || String(formData.get('serial') || '').trim() || undefined,
      name: formData.get('name'),
      category,
      displayCategory: displayCategoryFor(category),
      unitPrice,
      piecePrice: canned ? piecePrice : 0,
      packPrice: canned ? 0 : packPrice,
      packLabel: editing?.packLabel || (canned ? '1 piece / box' : '1 box / pack'),
      unitWeight: editing?.unitWeight || 'N/A',
      stock: Number(formData.get('stock')),
      image: imagePreview || editing?.image || assets.productFlour,
      description: String(formData.get('description') || ''),
    }

    try {
      if (editing) {
        await onUpdateInventoryProduct(editing.id, payload)
      } else {
        await onAddInventoryProduct(payload)
      }
      resetToList()
    } catch (err) {
      setError(err.message || 'Could not save product')
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete “${product.name}” from inventory? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(product.id)
    try {
      await onDeleteInventoryProduct(product.id)
    } catch {
      // Toast handled by parent
    } finally {
      setDeletingId(null)
    }
  }

  if (mode === 'form') {
    return (
      <ProductForm
        title={editing ? 'Edit Product' : 'Add Product'}
        subtitle={
          editing
            ? 'Update price, stock, and product details.'
            : 'Create a new wholesale item for your catalog.'
        }
        categories={categories}
        initial={editing}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        saving={saving}
        error={error}
        onCancel={resetToList}
        onSubmit={handleSubmit}
      />
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
                  <p className="category">
                    {product.displayCategory || displayCategoryFor(product.category)}
                  </p>
                  <h4>{product.name}</h4>
                  <div className="inventory-meta">
                    <strong>
                      {toCurrency(product.unitPrice)}
                      <small> /box</small>
                      <br />
                      <span className="piece-price-meta">{toCurrency(product.piecePrice)} /pc</span>
                    </strong>
                    <span>Qty: {String(product.stock).padStart(2, '0')}</span>
                  </div>
                  <div className="inventory-card-actions">
                    <button
                      type="button"
                      className="btn-ghost inventory-edit-btn"
                      onClick={() => openEditForm(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost inventory-delete-btn"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product)}
                    >
                      {deletingId === product.id ? 'Deleting…' : 'Delete'}
                    </button>
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
