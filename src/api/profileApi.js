import { supabase } from '../lib/supabaseClient'

function mapProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone,
    businessName: row.business_name,
  }
}

export async function updateProfile({ name, phone, businessName }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not signed in')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: String(name || '').trim(),
      phone: String(phone || '').trim() || null,
      business_name: String(businessName || '').trim() || null,
    })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw error

  await supabase.auth.updateUser({
    data: {
      name: data.name,
      phone: data.phone || '',
      business_name: data.business_name || '',
    },
  })

  return mapProfile(data)
}
