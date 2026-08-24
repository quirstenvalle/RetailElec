import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDeliveryAddress } from '../../utils/address'

const FALLBACK_REWARDS = {
  points: 1250,
  nextTier: 'Platinum',
  pointsToNextTier: 250,
}

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
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState('')
  const rewards = dashboard?.account || FALLBACK_REWARDS
  const offers = dashboard?.offers || []
  const activity = dashboard?.activity || []
  const redemptions = dashboard?.redemptions || []
  const progress = rewards.pointsToNextTier === 0 ? 100 : Math.min(100, (rewards.points / (rewards.points + rewards.pointsToNextTier)) * 100)
  const initials = (user?.name || 'My Profile')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    let active = true
    fetchRewards()
      .then((data) => active && setDashboard(data))
      .catch((loadError) => active && setError(loadError.message || 'Could not load rewards'))
    return () => { active = false }
  }, [fetchRewards])

  const handleRedeem = async (offer) => {
    setRedeeming(offer.id)
    setError('')
    try {
      await redeemReward(offer.id)
      setDashboard(await fetchRewards())
    } catch (redeemError) {
      setError(redeemError.message || 'Could not redeem reward')
    } finally {
      setRedeeming('')
    }
  }

  return (
    <section className="rewards-screen">
      <div className="profile-hero rewards-hero">
        <div className="profile-hero__content">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div><p className="profile-kicker">Wholesale customer</p><h1>{user?.name || 'My Profile'}</h1><p className="profile-email">{user?.email}</p></div>
        </div>
      </div>
      <div className="rewards-layout">
        <AccountOverview user={user} onLogout={onLogout} />
        <main className="rewards-content">
          <div className="rewards-heading"><div><h2><span aria-hidden="true">*</span> My Rewards</h2><div className="rewards-balance">{Number(rewards.points).toLocaleString()} Points <span>{rewards.tier}</span></div></div><Link to="/profile" className="profile-back">&larr; Back to Profile</Link></div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="rewards-progress"><div><span>Current Progress</span><span>{rewards.pointsToNextTier} points until {rewards.nextTier || 'next tier'}</span></div><div className="rewards-progress__track"><span style={{ width: `${progress}%` }} /></div></div>
          <div className="rewards-tabs" role="tablist" aria-label="Reward types">
            {REWARD_TABS.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
          </div>
          <div className="reward-grid">
            {offers.filter((offer) => offer.offer_type === (activeTab === 'vouchers' ? 'voucher' : activeTab === 'coupons' ? 'coupon' : 'raffle')).map((item) => <article className="reward-card" key={item.id}><h3>{item.title}</h3><p>{item.description}</p><strong>{item.points_cost} Points</strong><button type="button" className="btn-green" disabled={redeeming === item.id} onClick={() => handleRedeem(item)}>{redeeming === item.id ? 'Redeeming...' : 'Redeem'}</button></article>)}
          </div>
          <div className="rewards-lower-grid">
            <section><h3>Points Activity</h3><div className="activity-list">{activity.map((item) => <div className="activity-row" key={item.id}><span>{item.reason}<small>{new Date(item.created_at).toLocaleDateString()}</small></span><strong className={item.points > 0 ? 'positive' : 'negative'}>{item.points > 0 ? '+' : ''}{item.points}</strong></div>)}</div></section>
            <section><h3>My Redeemed Rewards</h3>{redemptions.map((item) => <div className="redeemed-card" key={item.id}><strong>{item.title}</strong><small>Valid until {new Date(item.expiresAt).toLocaleDateString()}</small><code>{item.code}</code></div>)}</section>
          </div>
        </main>
      </div>
    </section>
  )
}

export default CustomerRewardsPage
