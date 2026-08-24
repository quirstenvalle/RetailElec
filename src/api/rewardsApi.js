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
