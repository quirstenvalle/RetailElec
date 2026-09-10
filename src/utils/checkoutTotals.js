export const COURIER_DELIVERY_FEE = 30
export const VOLUME_DISCOUNT_RATE = 0.06
export const ONLINE_DISCOUNT_RATE = 0.005

export function getDeliveryFee(deliveryMode, subtotal = 0) {
  if (deliveryMode === 'courier' && Number(subtotal) > 0) {
    return COURIER_DELIVERY_FEE
  }
  return 0
}

export function computeCheckoutTotals({
  subtotal,
  deliveryMode,
  paymentMode = 'online',
  voucherDiscount = 0,
}) {
  const safeSubtotal = Number(subtotal) || 0
  const volumeDiscount = safeSubtotal > 0 ? Math.round(safeSubtotal * VOLUME_DISCOUNT_RATE) : 0
  const shipping = getDeliveryFee(deliveryMode, safeSubtotal)
  const onlineDiscount =
    paymentMode === 'online' && safeSubtotal > 0 ? Math.round(safeSubtotal * ONLINE_DISCOUNT_RATE) : 0
  const safeVoucher = Math.max(0, Number(voucherDiscount) || 0)
  const total = Math.max(0, safeSubtotal + shipping - volumeDiscount - onlineDiscount - safeVoucher)

  return {
    subtotal: safeSubtotal,
    volumeDiscount,
    shipping,
    onlineDiscount,
    voucherDiscount: safeVoucher,
    total,
  }
}
