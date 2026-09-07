import { supabase } from '../lib/supabaseClient'

function mapReview(row) {
  return {
    id: row.id,
    type: row.review_type,
    rating: row.rating,
    comment: row.comment || '',
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    orderNumber: row.orders?.order_number || row.order_number || '',
    orderTotal: Number(row.orders?.total || row.order_total) || 0,
    createdAt: row.created_at,
    status: row.status,
  }
}

export async function submitReviews({ orderNumber, storeRating, storeComment, orderRating, orderComment }) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, customer_name, total, status')
    .eq('order_number', orderNumber)
    .single()
  if (orderError) throw orderError
  if (order.status === 'Cancelled') throw new Error('Cancelled orders cannot be reviewed')

  const rows = [
    {
      review_type: 'store',
      order_id: order.id,
      rating: Number(storeRating),
      comment: String(storeComment || '').trim() || null,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
    },
    {
      review_type: 'order',
      order_id: order.id,
      rating: Number(orderRating),
      comment: String(orderComment || '').trim() || null,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
    },
  ]

  if (rows.some((row) => !Number.isInteger(row.rating) || row.rating < 1 || row.rating > 5)) {
    throw new Error('Choose a rating from 1 to 5 stars')
  }

  const { data, error } = await supabase
    .from('reviews')
    .upsert(rows, { onConflict: 'order_id,review_type' })
    .select('*')
  if (error) throw error
  return data.map(mapReview)
}

export async function fetchAdminReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, orders(order_number, total)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapReview)
}
