import { supabase } from '../lib/supabaseClient'

export function mapProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone,
    businessName: row.business_name,
    deliveryAddress: row.delivery_address || '',
    deliveryCity: row.delivery_city || '',
    deliveryProvince: row.delivery_province || '',
    deliveryPostalCode: row.delivery_postal_code || '',
  }
}

export async function updateProfile({
  name,
  phone,
  businessName,
  deliveryAddress,
  deliveryCity,
  deliveryProvince,
  deliveryPostalCode,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not signed in')

  const payload = {
    name: String(name || '').trim(),
    phone: String(phone || '').trim() || null,
    business_name: String(businessName || '').trim() || null,
  }

  if (deliveryAddress !== undefined) {
    payload.delivery_address = String(deliveryAddress || '').trim() || null
    payload.delivery_city = String(deliveryCity || '').trim() || null
    payload.delivery_province = String(deliveryProvince || '').trim() || null
    payload.delivery_postal_code = String(deliveryPostalCode || '').trim() || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw error

  await supabase.auth.updateUser({
    data: {
      name: data.name,
      phone: data.phone || '',
      business_name: data.business_name || '',
      delivery_address: data.delivery_address || '',
      delivery_city: data.delivery_city || '',
      delivery_province: data.delivery_province || '',
      delivery_postal_code: data.delivery_postal_code || '',
    },
  })

  return mapProfile(data)
}
