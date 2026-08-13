export function formatDeliveryAddress({
  deliveryAddress,
  deliveryCity,
  deliveryProvince,
  deliveryPostalCode,
} = {}) {
  return [deliveryAddress, deliveryCity, deliveryProvince, deliveryPostalCode]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')
}

export function hasDeliveryAddress(profile) {
  return Boolean(String(profile?.deliveryAddress || '').trim())
}
