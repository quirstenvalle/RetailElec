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

export function priceForUnit(product, pricingUnit = 'box') {
  const unit = normalizePricingUnitValue(pricingUnit)
  if (unit === 'piece') {
    return Number(product?.piecePrice) > 0 ? Number(product.piecePrice) : Number(product?.unitPrice) || 0
  }
  if (unit === 'pack') {
    return Number(product?.packPrice) > 0 ? Number(product.packPrice) : Number(product?.unitPrice) || 0
  }
  return Number(product?.unitPrice) || 0
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
