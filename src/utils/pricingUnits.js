/** Canned Goods: piece + box. All other categories: box + pack. */
export function isCannedGoodsCategory(category) {
  return String(category || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ') === 'canned goods'
}

export function allowedPricingUnits(category) {
  return isCannedGoodsCategory(category) ? ['piece', 'box'] : ['box', 'pack']
}

export function defaultPricingUnit(category) {
  return isCannedGoodsCategory(category) ? 'piece' : 'box'
}

export function coercePricingUnit(category, pricingUnit) {
  const allowed = allowedPricingUnits(category)
  if (allowed.includes(pricingUnit)) return pricingUnit
  return allowed[0]
}

export function normalizePricingUnitValue(pricingUnit) {
  if (pricingUnit === 'piece' || pricingUnit === 'pack') return pricingUnit
  return 'box'
}

export function getProductDiscountPercent(product) {
  const rawValue = Number(
    product?.deal_discount ??
      product?.dealDiscount ??
      product?.discountPercent ??
      product?.discount_percentage ??
      0,
  )
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 0
  return Math.min(Math.max(rawValue, 0), 100)
}

export function isProductOnSale(product) {
  if (!product) return false
  const isDealFlag = Boolean(product.is_deal ?? product.isDeal ?? product.is_featured ?? product.isFeatured)
  return isDealFlag || getProductDiscountPercent(product) > 0
}

export function getOriginalPrice(product, pricingUnit = 'box') {
  const unit = normalizePricingUnitValue(pricingUnit)
  if (unit === 'piece') {
    return Number(product?.piecePrice ?? product?.piece_price ?? product?.unitPrice ?? product?.unit_price) || 0
  }
  if (unit === 'pack') {
    return Number(product?.packPrice ?? product?.pack_price ?? product?.unitPrice ?? product?.unit_price) || 0
  }
  return Number(product?.unitPrice ?? product?.unit_price) || 0
}

export function getSalePrice(product, pricingUnit = 'box') {
  const originalPrice = getOriginalPrice(product, pricingUnit)
  const discountPercent = getProductDiscountPercent(product)
  if (!originalPrice || !discountPercent) return originalPrice
  return Number((originalPrice * (1 - discountPercent / 100)).toFixed(2))
}

export function priceForUnit(product, pricingUnit = 'box') {
  const originalPrice = getOriginalPrice(product, pricingUnit)
  const discountPercent = getProductDiscountPercent(product)
  if (!isProductOnSale(product) || !discountPercent) {
    return originalPrice
  }
  return Number((originalPrice * (1 - discountPercent / 100)).toFixed(2))
}

export function pricingUnitLabel(pricingUnit, { short = false } = {}) {
  if (pricingUnit === 'piece') return short ? 'pc' : 'Per piece'
  if (pricingUnit === 'pack') return short ? 'pack' : 'Per pack'
  return short ? 'box' : 'Per box'
}

export function pricingUnitSuffix(pricingUnit) {
  if (pricingUnit === 'piece') return '/ pc'
  if (pricingUnit === 'pack') return '/ pack'
  return '/ box'
}

export function unitToggleOptions(category) {
  return allowedPricingUnits(category).map((unit) => ({
    unit,
    label: unit === 'piece' ? 'Piece' : unit === 'pack' ? 'Pack' : 'Box',
  }))
}
