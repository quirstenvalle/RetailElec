import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_FORM = { title: '', description: '', offer_type: 'voucher', points_cost: 500, discount_amount: '', minimum_order: '', active: true }
const TYPES = { voucher: 'Vouchers', coupon: 'Coupons', raffle: 'Raffles' }

function RewardForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...form, points_cost: Number(form.points_cost), discount_amount: form.discount_amount === '' ? null : Number(form.discount_amount), minimum_order: form.minimum_order === '' ? null : Number(form.minimum_order) })
  }
  return <form className="admin-reward-form" onSubmit={submit}>
    <div className="reward-form-head"><button type="button" className="order-back" onClick={onCancel}>← Back to Rewards</button><h2>{initial ? `Edit ${form.offer_type}` : 'Add Reward'}</h2><p>Configure the details shown in the customer rewards catalog.</p></div>
    <div className="reward-form-columns">
      <div>
        {!initial ? <div className="reward-type-picker"><h3>Reward Type</h3><div>{Object.entries(TYPES).map(([value, label]) => <button type="button" key={value} className={form.offer_type === value ? 'selected' : ''} onClick={() => set('offer_type', value)}><strong aria-hidden="true">{value === 'voucher' ? '▣' : value === 'coupon' ? '▤' : '♙'}</strong><span>{label.slice(0, -1)}</span></button>)}</div></div> : null}
        <div className="reward-form-card"><h3>{form.offer_type === 'raffle' ? 'Raffle Details' : form.offer_type === 'coupon' ? 'Coupon Details' : 'Voucher Details'}</h3>
          <div className="field"><label>{form.offer_type === 'raffle' ? 'RAFFLE NAME' : form.offer_type === 'coupon' ? 'COUPON NAME' : 'VOUCHER NAME'}</label><input required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={form.offer_type === 'raffle' ? 'e.g. Monthly Grocery Raffle' : 'e.g. P50 OFF'} /></div>
          <div className="field"><label>DESCRIPTION</label><textarea required rows="3" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the reward terms and conditions..." /></div>
          {form.offer_type === 'voucher' ? <div className="reward-form-row"><div className="field"><label>POINTS REQUIRED</label><input required min="1" type="number" value={form.points_cost} onChange={(e) => set('points_cost', e.target.value)} /></div><div className="field"><label>DISCOUNT AMOUNT</label><input min="0" type="number" value={form.discount_amount ?? ''} onChange={(e) => set('discount_amount', e.target.value)} placeholder="P 50" /></div></div> : null}
          {form.offer_type === 'raffle' ? <div className="reward-form-row"><div className="field"><label>PRIZE</label><input placeholder="e.g. P2,000 Grocery Voucher" /></div><div className="field"><label>PRIZE VALUE</label><input min="0" type="number" value={form.discount_amount ?? ''} onChange={(e) => set('discount_amount', e.target.value)} placeholder="P 2,000" /></div></div> : null}
          {form.offer_type === 'voucher' ? <div className="reward-form-row"><div className="field"><label>MINIMUM PURCHASE</label><input min="0" type="number" value={form.minimum_order ?? ''} onChange={(e) => set('minimum_order', e.target.value)} placeholder="Optional" /></div><div className="field"><label>MAX DISCOUNT (OPTIONAL)</label><input min="0" type="number" placeholder="No limit" /></div></div> : null}
        </div>
        {form.offer_type === 'coupon' ? <div className="reward-form-card"><h3>Discount Configuration</h3><div className="reward-form-row"><div className="field"><label>DISCOUNT VALUE (%)</label><input min="0" max="100" type="number" placeholder="10" /></div><div className="field"><label>MAXIMUM DISCOUNT</label><input min="0" type="number" placeholder="P 500" /></div></div><div className="reward-form-row"><div className="field"><label>MINIMUM PURCHASE</label><input min="0" type="number" value={form.minimum_order ?? ''} onChange={(e) => set('minimum_order', e.target.value)} placeholder="P 2,000" /></div><div className="field"><label>POINTS REQUIRED</label><input required min="1" type="number" value={form.points_cost} onChange={(e) => set('points_cost', e.target.value)} /></div></div></div> : null}
        {form.offer_type === 'raffle' ? <div className="reward-form-card"><h3>Entry &amp; Participation</h3><div className="reward-form-row"><div className="field"><label>POINTS PER ENTRY</label><input required min="1" type="number" value={form.points_cost} onChange={(e) => set('points_cost', e.target.value)} /></div><div className="field"><label>MAX ENTRIES PER CUSTOMER</label><input min="1" type="number" placeholder="Unlimited" /></div></div><div className="field"><label>NUMBER OF WINNERS</label><input min="1" type="number" defaultValue="1" /></div></div> : null}
      </div>
      <aside className="reward-form-side"><div className="reward-form-card"><h3>{form.offer_type === 'raffle' ? 'Timeline & Status' : 'Availability'}</h3><div className="field"><label>{form.offer_type === 'raffle' ? 'DRAW DATE' : 'EXPIRATION DATE'}</label><input type="date" /></div>{form.offer_type === 'raffle' ? <div className="field"><label>STATUS</label><select><option>Upcoming</option><option>Open</option><option>Closed</option></select></div> : <div className="field"><label>MAX REDEMPTIONS</label><input type="number" min="1" placeholder="Unlimited" /></div>}</div><div className="reward-form-card"><h3>Publish Status</h3><label className="admin-reward-toggle"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active and visible to customers</label></div><button type="submit" className="btn-green">{initial ? 'Save Changes' : `Create ${form.offer_type === 'raffle' ? 'Raffle' : form.offer_type === 'coupon' ? 'Coupon' : 'Voucher'}`}</button></aside>
    </div>
  </form>
}

function AdminRewardsPage({ fetchAdminRewards, createReward, updateReward, updateRedemptionStatus }) {
  const [data, setData] = useState({ offers: [], redemptions: [], pointsIssued: 0, pointsRedeemed: 0 })
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); try { setData(await fetchAdminRewards()) } catch (err) { setError(err.message || 'Could not load rewards') } finally { setLoading(false) } }, [fetchAdminRewards])
  useEffect(() => { load() }, [load])
  const offers = useMemo(() => filter === 'all' ? data.offers : data.offers.filter((item) => item.offer_type === filter), [data.offers, filter])
  const pending = data.redemptions.filter((item) => item.fulfillment_status === 'pending').length
  if (editing) return <section className="admin-page"><RewardForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSave={async (payload) => { try { if (editing === 'new') await createReward(payload); else await updateReward(editing.id, payload); setEditing(null); await load() } catch (err) { setError(err.message || 'Could not save reward') } }} /></section>
  return <section className="admin-page rewards-admin-page">
    <div className="admin-toolbar"><div><h2>Points Program</h2><p>Manage and track loyalty rewards and redemption requests.</p></div><button type="button" className="btn-green" onClick={() => setEditing('new')}>+ Add Reward</button></div>
    {error ? <p className="form-error">{error}</p> : null}
    <div className="stats-grid rewards-admin-stats"><article className="stat-card"><h3>Points Issued</h3><p>{data.pointsIssued.toLocaleString()}</p></article><article className="stat-card"><h3>Points Redeemed</h3><p>{data.pointsRedeemed.toLocaleString()}</p></article><article className="stat-card"><h3>Pending Requests</h3><p>{pending}</p></article><article className="stat-card"><h3>Active Rewards</h3><p>{data.offers.filter((item) => item.active).length}</p></article></div>
    <div className="reward-admin-panel"><div className="reward-admin-tabs">{[['all', 'All'], ...Object.entries(TYPES).map(([id, label]) => [id, label])].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)} type="button">{label}</button>)}</div><div className="admin-table reward-admin-table"><div className="admin-row head"><span>Reward</span><span>Type</span><span>Points</span><span>Redemptions</span><span>Status</span><span>Action</span></div>{loading ? <div className="empty-state">Loading rewards...</div> : offers.map((item) => <div className="admin-row" key={item.id}><strong>{item.title}</strong><span>{item.offer_type}</span><span>{item.points_cost}</span><span>—</span><span className={item.active ? 'status-ok' : 'status-muted'}>{item.active ? 'Active' : 'Hidden'}</span><button type="button" className="table-action" onClick={() => setEditing(item)}>Edit</button></div>)}</div></div>
    <h3 className="reward-request-title">Redemption Requests</h3><div className="admin-table reward-admin-table"><div className="admin-row head"><span>User</span><span>Item</span><span>Points</span><span>Date</span><span>Status</span><span>Action</span></div>{data.redemptions.map((item) => <div className="admin-row" key={item.id}><span>{item.userName}</span><span>{item.offerTitle}</span><span>{item.points_cost}</span><span>{new Date(item.created_at).toLocaleDateString()}</span><span>{item.fulfillment_status || 'Pending'}</span><select value={item.fulfillment_status || 'pending'} onChange={async (e) => { await updateRedemptionStatus(item.id, e.target.value); await load() }}><option value="pending">Review</option><option value="shipped">Shipped</option><option value="completed">Completed</option></select></div>)}</div>
  </section>
}

export default AdminRewardsPage
