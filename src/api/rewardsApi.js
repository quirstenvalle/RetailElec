import { supabase } from '../lib/supabaseClient'

export async function fetchRewards() {
  const { data, error } = await supabase.rpc('rewards_dashboard')
  if (error) throw error
  return data
}

export async function redeemReward(offerId) {
  const { data, error } = await supabase.rpc('redeem_reward', { p_offer_id: offerId })
  if (error) throw error
  return data
}

export async function fetchAvailableVouchers() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reward_redemptions')
    .select(`
      id,
      code,
      status,
      expires_at,
      reward_offers (
        id,
        title,
        offer_type,
        discount_amount,
        minimum_order
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    code: row.code,
    expiresAt: row.expires_at,
    title: row.reward_offers?.title || 'Reward Voucher',
    offerType: row.reward_offers?.offer_type,
    discountAmount: Number(row.reward_offers?.discount_amount) || 0,
    minimumOrder: Number(row.reward_offers?.minimum_order) || 0,
  }))
}

export async function markVoucherAsUsed(redemptionId) {
  if (!redemptionId) return
  const { error } = await supabase
    .from('reward_redemptions')
    .update({
      status: 'used',
      fulfillment_status: 'completed',
    })
    .eq('id', redemptionId)

  if (error) throw error
}