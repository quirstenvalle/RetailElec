import { supabase } from '../lib/supabaseClient'
import { todayLabel } from '../utils/formatters'
import { notifyAdmins, notifyUser } from './notificationsApi'

function mapOrder(row) {
  return {
    id: row.order_number,
    uuid: row.id,
    receiptId: row.receipt_id,
    customer: row.customer_name,
    customerEmail: row.customer_email,
    orderDate: row.order_date,
    status: row.status,
    deliveryMode: row.delivery_mode,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    total: Number(row.total),
  }
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapOrder)
}

export async function updateOrderStatus(orderNumber, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_number', orderNumber)
    .select('*')
    .single()
  if (error) throw error

  if (data.customer_email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.customer_email)
      .maybeSingle()
    if (profile?.id) {
      await notifyUser({
        userId: profile.id,
        title: `Order ${data.order_number} updated`,
        body: `Your order status is now ${status}.`,
        type: 'order',
        link: '/order-success',
      })
    }
  }

  return mapOrder(data)
}

export async function submitOrder({ user, cartItems, deliveryMode, paymentMode, total }) {
  const { data: orderNumber, error: numberError } = await supabase.rpc('next_order_number')
  if (numberError) throw numberError

  const receiptId = `#LMN-${Math.floor(100000 + Math.random() * 900000)}`
  const orderDate = todayLabel()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      receipt_id: receiptId,
      customer_id: customer?.id ?? null,
      customer_name: user.name,
      customer_email: user.email,
      status: 'Pending',
      delivery_mode: deliveryMode,
      payment_mode: paymentMode,
      payment_status: paymentMode === 'online' ? 'paid' : 'unpaid',
      paid_at: paymentMode === 'online' ? new Date().toISOString() : null,
      total,
      order_date: orderDate,
    })
    .select('*')
    .single()

  if (orderError) throw orderError

  const itemsPayload = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    name: item.name,
    category: item.category,
    display_category: item.displayCategory,
    unit_price: item.unitPrice,
    piece_price: item.piecePrice,
    pack_label: item.packLabel,
    unit_weight: item.unitWeight,
    image_path: item.image,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload)
  if (itemsError) throw itemsError

  if (customer?.id) {
    await supabase
      .from('customers')
      .update({ last_transaction: orderDate })
      .eq('id', customer.id)
  }

  await supabase.from('cart_items').delete().eq('user_id', user.id)

  await notifyUser({
    userId: user.id,
    title: 'Order placed',
    body: `Order ${orderNumber} submitted via cash on delivery.`,
    type: 'order',
    link: '/order-success',
  })
  await notifyAdmins({
    title: 'New cash order',
    body: `${user.name} placed ${orderNumber} (COD).`,
    type: 'order',
    link: '/admin/orders',
  })

  return {
    id: receiptId,
    total,
    items: cartItems.map((item) => ({ ...item })),
    deliveryMode,
    paymentMode,
    orderDate,
    orderNumber,
  }
}
