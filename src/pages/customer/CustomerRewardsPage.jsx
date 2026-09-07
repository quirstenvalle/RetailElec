import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDeliveryAddress } from '../../utils/address'

const REWARD_TABS = [
  { id: 'vouchers', label: 'Vouchers' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'raffle', label: 'Raffle Entries' },
]

function AccountOverview({ user, onLogout }) {
  const address = formatDeliveryAddress(user)

  return (
    <aside className="profile-summary rewards-summary">
      <h2>Account overview</h2>
      <ul>
        <li><span>Role</span><strong>Customer</strong></li>
        <li><span>Email</span><strong>{user?.email || 'Not set'}</strong></li>
        <li><span>Phone</span><strong>{user?.phone || 'Not set'}</strong></li>
        <li><span>Business</span><strong>{user?.businessName || 'Not set'}</strong></li>
        <li><span>Delivery address</span><strong>{address || 'Not set'}</strong></li>
      </ul>
      <div className="profile-tip">
        <span className="rewards-pin" aria-hidden="true">+</span>
        <p>Save your delivery address so it is ready at checkout.</p>
      </div>
      <Link to="/profile" className="profile-rewards-link rewards-summary__active">
        <span className="profile-rewards-link__icon" aria-hidden="true">*</span>
        <span><strong>My Rewards</strong><small>View vouchers, coupons, and raffle entries</small></span>
        <b>Rewards</b>
      </Link>
      <button type="button" className="btn-ghost profile-signout" onClick={onLogout}>Sign out</button>
    </aside>
  )
}

function CustomerRewardsPage({ user, onLogout, fetchRewards, redeemReward }) {
  const [activeTab, setActiveTab] = useState('vouchers')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState('')

  const points = dashboard?.account?.points ?? dashboard?.points ?? 0
  const tier = dashboard?.account?.tier || 'Bronze'
  const nextTier = dashboard?.account?.nextTier || 'Silver'
  const pointsToNextTier = dashboard?.account?.pointsToNextTier ?? 500

  const offers = dashboard?.offers || []
  const activity = dashboard?.activity || dashboard?.ledger || []
  const redemptions = dashboard?.redemptions || []

  const progress = pointsToNextTier === 0 ? 100 : Math.min(100, (points / (points + pointsToNextTier)) * 100)

  const initials = (user?.name || 'My Profile')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchRewards()
      setDashboard(data)
    } catch (loadError) {
      setError(loadError.message || 'Could not load rewards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRedeem = async (offer) => {
    setRedeeming(offer.id)
    setError('')
    try {
      await redeemReward(offer.id)
      const freshData = await fetchRewards()
      setDashboard(freshData)
    } catch (redeemError) {
      setError(redeemError.message || 'Could not redeem reward')
    } finally {
      setRedeeming('')
    }
  }

  const currentTabOfferType = activeTab === 'vouchers' ? 'voucher' : activeTab === 'coupons' ? 'coupon' : 'raffle'
  const visibleOffers = offers.filter((offer) => offer.offer_type === currentTabOfferType)

  return (
    <section className="rewards-screen">
      <div className="profile-hero rewards-hero">
        <div className="profile-hero__content">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div>
            <p className="profile-kicker">Wholesale customer</p>
            <h1>{user?.name || 'My Profile'}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="rewards-layout">
        <AccountOverview user={user} onLogout={onLogout} />
        <main className="rewards-content">
          <div className="rewards-heading">
            <div>
              <h2><span aria-hidden="true">*</span> My Rewards</h2>
              <div className="rewards-balance">
                {loading ? '…' : Number(points).toLocaleString()} Points <span>{tier}</span>
              </div>
            </div>
            <Link to="/profile" className="profile-back">&larr; Back to Profile</Link>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="rewards-progress">
            <div>
              <span>Current Progress</span>
              <span>{pointsToNextTier} points until {nextTier}</span>
            </div>
            <div className="rewards-progress__track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="rewards-tabs" role="tablist" aria-label="Reward types">
            {REWARD_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="reward-grid">
            {visibleOffers.length === 0 ? (
              <p className="empty-state" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                No active rewards in this category yet.
              </p>
            ) : (
              visibleOffers.map((item) => (
                <article className="reward-card" key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <strong>{item.points_cost} Points</strong>
                  <button
                    type="button"
                    className="btn-green"
                    disabled={redeeming === item.id || points < item.points_cost}
                    onClick={() => handleRedeem(item)}
                  >
                    {redeeming === item.id
                      ? 'Redeeming...'
                      : points < item.points_cost
                        ? 'Insufficient Points'
                        : 'Redeem'}
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="rewards-lower-grid">
            <section>
              <h3>Points Activity</h3>
              <div className="activity-list">
                {activity.length === 0 ? (
                  <p className="empty-state">No points activity recorded yet.</p>
                ) : (
                  activity.map((item) => (
                    <div className="activity-row" key={item.id}>
                      <span>
                        {item.reason}
                        <small>{new Date(item.created_at).toLocaleDateString()}</small>
                      </span>
                      <strong className={item.points > 0 ? 'positive' : 'negative'}>
                        {item.points > 0 ? '+' : ''}
                        {item.points}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3>My Redeemed Rewards</h3>
              {redemptions.length === 0 ? (
                <p className="empty-state">You haven&apos;t redeemed any vouchers yet.</p>
              ) : (
                redemptions.map((item) => {
                  const expiryDate = item.expiresAt || item.expires_at
                  return (
                    <div className="redeemed-card" key={item.id}>
                      <strong>{item.title}</strong>
                      <small>
                        {expiryDate ? `Valid until ${new Date(expiryDate).toLocaleDateString()}` : 'No expiration date'}
                      </small>
                      <code>{item.code}</code>
                    </div>
                  )
                })
              )}
            </section>
          </div>
        </main>
      </div>
    </section>
  )
}

export default CustomerRewardsPage