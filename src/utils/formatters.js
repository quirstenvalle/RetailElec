export const toCurrency = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0)

export const clampQuantity = (value) => Math.max(1, Math.floor(Number(value) || 1))

export const todayLabel = () =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())
