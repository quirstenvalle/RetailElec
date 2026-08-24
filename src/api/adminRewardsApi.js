import { supabase } from '../lib/supabaseClient'

export async function fetchAdminRewards() {
  const [{ data: offers, error: offersError }, { data: redemptions, error: redemptionsError }, { data: ledger, error: ledgerError }] = await Promise.all([
    supabase.from('reward_offers').select('*').order('created_at', { ascending: false }),
    supabase.from('reward_redemptions').select('id, user_id, points_cost, status, created_at, reward_offers(title, offer_type), profiles(name)').order('created_at', { ascending: false }),
    supabase.from('reward_ledger').select('points'),
  ])
  if (offersError) throw offersError
  if (redemptionsError) throw redemptionsError
  if (ledgerError) throw ledgerError

  return {
    offers: offers || [],
    redemptions: (redemptions || []).map((item) => ({
      ...item,
      userName: item.profiles?.name || 'Customer',
      offerTitle: item.reward_offers?.title || 'Reward',
      type: item.reward_offers?.offer_type || 'voucher',
    })),
    pointsIssued: (ledger || []).filter((item) => item.points > 0).reduce((sum, item) => sum + item.points, 0),
    pointsRedeemed: Math.abs((ledger || []).filter((item) => item.points < 0).reduce((sum, item) => sum + item.points, 0)),
  }
}

export async function createReward(payload) {
  const { data, error } = await supabase.from('reward_offers').insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function updateReward(id, payload) {
  const { data, error } = await supabase.from('reward_offers').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function updateRedemptionStatus(id, status) {
  const { data, error } = await supabase.from('reward_redemptions').update({ fulfillment_status: status }).eq('id', id).select('*').single()
  if (error) throw error
  return data
}
