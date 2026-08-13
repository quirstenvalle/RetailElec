const STATUS_RANK = {
  Pending: 0,
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: -1,
}

export function getOrderTrackingSteps(order) {
  const isPickup = order?.deliveryMode === 'pickup'
  const status = order?.status || 'Pending'
  const cancelled = status === 'Cancelled'
  const rank = STATUS_RANK[status] ?? 0

  return [
    { key: 'Pending', label: 'Order placed' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped', label: isPickup ? 'Ready for pickup' : 'Shipped' },
    { key: 'Delivered', label: isPickup ? 'Picked up' : 'Delivered' },
  ].map((step, index) => ({
    ...step,
    state: cancelled ? 'idle' : index < rank ? 'done' : index === rank ? 'current' : 'idle',
  }))
}

export function getOrderStatusBlurb(order) {
  const isPickup = order?.deliveryMode === 'pickup'
  switch (order?.status) {
    case 'Pending':
      return 'We received your order and will start preparing it soon.'
    case 'Processing':
      return isPickup
        ? 'Your order is being prepared for pickup.'
        : 'Your order is being packed for shipment.'
    case 'Shipped':
      return isPickup
        ? 'Your order is ready for pickup at MarketBulk Central Hub, Cavite.'
        : order?.trackingNumber
          ? `In transit via ${order.shippingCarrier || 'courier'}. Tracking: ${order.trackingNumber}`
          : 'Your order has been shipped.'
    case 'Delivered':
      return isPickup ? 'This order was picked up. Thank you!' : 'This order was delivered. Thank you!'
    case 'Cancelled':
      return 'This order was cancelled.'
    default:
      return 'Track the latest status of your wholesale order here.'
  }
}
