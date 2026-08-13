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
    customerId: row.customer_id,
    shippingCarrier: row.shipping_carrier || '',
    trackingNumber: row.tracking_number || '',
    shippedAt: row.shipped_at || '',
    shippingFee: Number(row.shipping_fee) || 0,
    shippingAddress: row.shipping_address || '',
    shippingCity: row.shipping_city || '',
    shippingProvince: row.shipping_province || '',
    shippingPostalCode: row.shipping_postal_code || '',
  }
}

function mapOrderItem(row) {
  const pricingUnit = row.pricing_unit === 'piece' ? 'piece' : 'box'
  const unitPrice =
    pricingUnit === 'piece' ? Number(row.piece_price) || Number(row.unit_price) || 0 : Number(row.unit_price) || 0
  const quantity = Number(row.quantity) || 0
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.product_id || '—',
    category: row.category,
    displayCategory: row.display_category,
    unitPrice,
    piecePrice: Number(row.piece_price) || 0,
    pricingUnit,
    quantity,
    lineTotal: unitPrice * quantity,
    image: row.image_path,
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

export async function fetchMyOrders() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Sign in to view your orders')

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapOrder)
}

export async function fetchMyOrderDetails(orderNumber) {
  return fetchOrderDetails(orderNumber)
}

export async function fetchOrderDetails(orderNumber) {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()
  if (error) throw error

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)
  if (itemsError) throw itemsError

  let customerPhone = ''
  if (order.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('phone, name, email')
      .eq('id', order.customer_id)
      .maybeSingle()
    customerPhone = customer?.phone || ''
  } else if (order.customer_email) {
    const { data: customer } = await supabase
      .from('customers')
      .select('phone')
      .eq('email', order.customer_email)
      .maybeSingle()
    customerPhone = customer?.phone || ''
  }

  const mappedItems = (items || []).map(mapOrderItem)
  const subtotal = mappedItems.reduce((sum, item) => sum + item.lineTotal, 0)

  return {
    ...mapOrder(order),
    customerPhone,
    items: mappedItems,
    subtotal,
  }
}

async function notifyOrderStatus(data, status) {
  if (!data.customer_email) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.customer_email)
    .maybeSingle()
  if (!profile?.id) return

  const isPickup = data.delivery_mode === 'pickup'
  let body = `Your order status is now ${status}.`
  if (isPickup && status === 'Shipped') {
    body = 'Your order is ready for pickup at MarketBulk Central Hub, Cavite.'
  } else if (isPickup && status === 'Delivered') {
    body = 'Your order has been marked as picked up. Thank you!'
  }

  await notifyUser({
    userId: profile.id,
    title: `Order ${data.order_number} updated`,
    body,
    type: 'order',
    link: `/orders?order=${data.order_number}`,
  })
}

export async function updateOrderStatus(orderNumber, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_number', orderNumber)
    .select('*')
    .single()
  if (error) throw error

  await notifyOrderStatus(data, status)
  return mapOrder(data)
}

export async function shipOrder(orderNumber, { carrier, trackingNumber, shippedAt, shippingFee }) {
  const trimmedCarrier = String(carrier || '').trim()
  const trimmedTracking = String(trackingNumber || '').trim()
  if (!trimmedCarrier) throw new Error('Select a shipping carrier')
  if (!trimmedTracking) throw new Error('Enter a tracking number')

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'Shipped',
      shipping_carrier: trimmedCarrier,
      tracking_number: trimmedTracking,
      shipped_at: shippedAt || new Date().toISOString().slice(0, 10),
      shipping_fee: Number(shippingFee) || 0,
    })
    .eq('order_number', orderNumber)
    .select('*')
    .single()
  if (error) throw error

  await notifyOrderStatus(data, 'Shipped')
  return mapOrder(data)
}

export async function applyOrderStock(orderNumber) {
  if (!orderNumber) return
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, stock_applied')
    .eq('order_number', orderNumber)
    .maybeSingle()
  if (error) throw error
  if (!order?.id || order.stock_applied) return

  const { error: stockError } = await supabase.rpc('decrement_stock_for_order', {
    p_order_id: order.id,
  })
  if (stockError) throw new Error(stockError.message || 'Could not update stock for this order')
}

export async function submitOrder({ user, cartItems, deliveryMode, paymentMode, total, shippingAddress }) {
  const { data: orderNumber, error: numberError } = await supabase.rpc('next_order_number')
  if (numberError) throw numberError

  const receiptId = `#LMN-${Math.floor(100000 + Math.random() * 900000)}`
  const orderDate = todayLabel()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  const address = shippingAddress || {}
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
      shipping_address: deliveryMode === 'courier' ? String(address.deliveryAddress || '').trim() || null : null,
      shipping_city: deliveryMode === 'courier' ? String(address.deliveryCity || '').trim() || null : null,
      shipping_province: deliveryMode === 'courier' ? String(address.deliveryProvince || '').trim() || null : null,
      shipping_postal_code:
        deliveryMode === 'courier' ? String(address.deliveryPostalCode || '').trim() || null : null,
    })
    .select('*')
    .single()

  if (orderError) throw orderError

  const itemsPayload = cartItems.map((item) => {
    const pricingUnit = item.pricingUnit === 'piece' ? 'piece' : 'box'
    return {
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      category: item.category,
      display_category: item.displayCategory,
      unit_price: Number(item.unitPrice) || 0,
      piece_price: Number(item.piecePrice) || 0,
      pricing_unit: pricingUnit,
      pack_label: item.packLabel,
      unit_weight: item.unitWeight,
      image_path: item.image,
      quantity: item.quantity,
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload)
  if (itemsError) throw itemsError

  const { error: stockError } = await supabase.rpc('decrement_stock_for_order', {
    p_order_id: order.id,
  })
  if (stockError) throw new Error(stockError.message || 'Could not update stock for this order')

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
    link: `/orders?order=${orderNumber}`,
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
