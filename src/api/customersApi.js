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
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapCustomer)
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
