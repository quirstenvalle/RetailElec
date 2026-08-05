import { supabase } from '../lib/supabaseClient'
import { clampQuantity } from '../utils/formatters'

export async function fetchCart(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId)
  if (error) throw error
  return data.map((row) => ({ id: row.product_id, quantity: row.quantity }))
}

export async function upsertCartItem(userId, productId, quantity) {
  const safeQuantity = clampQuantity(quantity)
  const { error } = await supabase.from('cart_items').upsert(
    {
      user_id: userId,
      product_id: productId,
      quantity: safeQuantity,
    },
    { onConflict: 'user_id,product_id' },
  )
  if (error) throw error
}

export async function addToCartRemote(userId, productId, quantity = 1) {
  const safeQuantity = clampQuantity(quantity)
  const { data: existing } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  const nextQuantity = (existing?.quantity || 0) + safeQuantity
  await upsertCartItem(userId, productId, nextQuantity)
  return nextQuantity
}

export async function removeCartItem(userId, productId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}

export async function clearCartRemote(userId) {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (error) throw error
}
