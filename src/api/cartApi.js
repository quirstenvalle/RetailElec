import { supabase } from '../lib/supabaseClient'
import { clampQuantity } from '../utils/formatters'

function normalizeUnit(pricingUnit) {
  return pricingUnit === 'piece' ? 'piece' : 'box'
}

export async function fetchCart(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity, pricing_unit')
    .eq('user_id', userId)
  if (error) throw error
  return data.map((row) => ({
    id: row.product_id,
    quantity: row.quantity,
    pricingUnit: normalizeUnit(row.pricing_unit),
  }))
}

export async function upsertCartItem(userId, productId, quantity, pricingUnit = 'box') {
  const safeQuantity = clampQuantity(quantity)
  const unit = normalizeUnit(pricingUnit)
  const { error } = await supabase.from('cart_items').upsert(
    {
      user_id: userId,
      product_id: productId,
      quantity: safeQuantity,
      pricing_unit: unit,
    },
    { onConflict: 'user_id,product_id,pricing_unit' },
  )
  if (error) throw error
}

export async function addToCartRemote(userId, productId, quantity = 1, pricingUnit = 'box') {
  const safeQuantity = clampQuantity(quantity)
  const unit = normalizeUnit(pricingUnit)
  const { data: existing } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('pricing_unit', unit)
    .maybeSingle()

  const nextQuantity = (existing?.quantity || 0) + safeQuantity
  await upsertCartItem(userId, productId, nextQuantity, unit)
  return nextQuantity
}

export async function removeCartItem(userId, productId, pricingUnit = 'box') {
  const unit = normalizeUnit(pricingUnit)
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('pricing_unit', unit)
  if (error) throw error
}

export async function clearCartRemote(userId) {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (error) throw error
}
