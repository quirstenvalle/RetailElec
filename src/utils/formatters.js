export const toCurrency = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0)

export const clampQuantity = (value) => Math.max(1, Math.floor(Number(value) || 1))

export const normalizePricingUnit = (pricingUnit) => {
  if (pricingUnit === 'piece' || pricingUnit === 'pack') return pricingUnit
  return 'box'
}

export const unitPriceFor = (product, pricingUnit = 'box') => {
  const unit = normalizePricingUnit(pricingUnit)
  if (unit === 'piece') return Number(product?.piecePrice) || Number(product?.unitPrice) || 0
  if (unit === 'pack') return Number(product?.packPrice) || Number(product?.unitPrice) || 0
  return Number(product?.unitPrice) || 0
}

export const unitLabelFor = (pricingUnit = 'box') => {
  const unit = normalizePricingUnit(pricingUnit)
  if (unit === 'piece') return 'per piece'
  if (unit === 'pack') return 'per pack'
  return 'per box'
}

export const todayLabel = () =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())
