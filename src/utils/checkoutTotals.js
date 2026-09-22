export const COURIER_DELIVERY_FEE = 30
export const ONLINE_DISCOUNT_RATE = 0.005

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

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
  const safeSubtotal = roundMoney(subtotal)
  const shipping = getDeliveryFee(deliveryMode, safeSubtotal)
  const onlineDiscount =
    paymentMode === 'online' && safeSubtotal > 0
      ? roundMoney(safeSubtotal * ONLINE_DISCOUNT_RATE)
      : 0
  const safeVoucher = Math.min(safeSubtotal, Math.max(0, roundMoney(voucherDiscount)))
  const total = roundMoney(Math.max(0, safeSubtotal + shipping - onlineDiscount - safeVoucher))

  return {
    subtotal: safeSubtotal,
    shipping,
    onlineDiscount,
    voucherDiscount: safeVoucher,
    total,
  }
}
