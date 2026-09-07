import { useCallback, useEffect, useMemo, useState } from 'react'

const labels = { store: 'Store', order: 'Order' }

function Stars({ rating }) {
  return <span className="review-stars" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}<span>{'★'.repeat(5 - rating)}</span></span>
}

function AdminReviewsPage({ fetchAdminReviews }) {
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReviews(await fetchAdminReviews())
    } catch (err) {
      setError(err.message || 'Could not load reviews')
    } finally {
      setLoading(false)
    }
  }, [fetchAdminReviews])

  useEffect(() => { load() }, [load])

  const visible = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter((review) => review.type === filter)),
    [filter, reviews],
  )
  const average = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <section className="admin-page reviews-admin-page">
      <div className="admin-toolbar">
        <div>
          <h2>Reviews</h2>
          <p>Read customer feedback for the store and every transaction.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={load}>Refresh</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="stats-grid reviews-stats">
        <article className="stat-card"><h3>Total Reviews</h3><p>{reviews.length}</p></article>
        <article className="stat-card"><h3>Average Rating</h3><p>{average} / 5</p></article>
        <article className="stat-card"><h3>Store Reviews</h3><p>{reviews.filter((review) => review.type === 'store').length}</p></article>
        <article className="stat-card"><h3>Order Reviews</h3><p>{reviews.filter((review) => review.type === 'order').length}</p></article>
      </div>
      <div className="review-filter-tabs" role="tablist" aria-label="Review type">
        {['all', 'store', 'order'].map((value) => (
          <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All Reviews' : `${labels[value]} Reviews`}
          </button>
        ))}
      </div>
      <div className="admin-table-card">
        <div className="admin-table reviews-admin-table">
          <div className="admin-row head"><span>Review</span><span>Type</span><span>Customer</span><span>Order</span><span>Date</span></div>
          {loading ? <div className="empty-state">Loading reviews...</div> : visible.length === 0 ? <div className="empty-state">No reviews yet.</div> : visible.map((review) => (
            <div className="admin-row" key={review.id}>
              <div className="review-admin-copy"><Stars rating={review.rating} /><span>{review.comment || 'No written comment'}</span></div>
              <span>{labels[review.type]}</span>
              <span>{review.customerName}<small>{review.customerEmail}</small></span>
              <span>{review.orderNumber || '—'}</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AdminReviewsPage