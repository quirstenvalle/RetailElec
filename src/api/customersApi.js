import { supabase } from '../lib/supabaseClient'

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    lastTransaction: row.last_transaction,
    userId: row.user_id,
  }
}

export async function fetchCustomers() {
  const { data: customerRows, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, phone')
    .eq('role', 'customer')
  if (profileError) throw profileError

  const customersByEmail = new Map(customerRows.map((row) => [row.email.toLowerCase(), row]))
  for (const profile of profileRows || []) {
    const email = String(profile.email || '').trim().toLowerCase()
    if (!email || customersByEmail.has(email)) continue

    const { data: idData, error: idError } = await supabase.rpc('next_customer_id')
    if (idError) throw idError
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({
        id: idData,
        user_id: profile.id,
        name: profile.name || email.split('@')[0],
        email,
        phone: profile.phone || 'N/A',
        last_transaction: 'No transaction yet',
      })
      .select('*')
      .single()
    if (createError) {
      if (createError.code === '23505') continue
      throw createError
    }
    customersByEmail.set(email, created)
  }

  return Array.from(customersByEmail.values())
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
    .map(mapCustomer)
}

export async function addCustomer(customer) {
  const { data: idData, error: idError } = await supabase.rpc('next_customer_id')
  if (idError) throw idError

  const payload = {
    id: idData,
    name: customer.name,
    email: String(customer.email).trim().toLowerCase(),
    phone: customer.phone,
    last_transaction: customer.lastTransaction || 'No transaction yet',
  }

  const { data, error } = await supabase.from('customers').insert(payload).select('*').single()
  if (error) throw error
  return mapCustomer(data)
}

export async function updateCustomer(customerId, { name, email, phone }) {
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
    })
    .eq('id', customerId)
    .select('*')
    .single()
  if (error) throw error
  return mapCustomer(data)
}
