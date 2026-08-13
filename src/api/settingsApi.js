import { supabase } from '../lib/supabaseClient'

const DEFAULT_SETTINGS = {
  storeName: 'Quinto Store',
  contactEmail: 'admin@quinto.store',
  contactPhone: '',
  address: '',
  notifyNewOrders: true,
  notifyLowStock: true,
  notifyCancellations: true,
  sidebarOpenDefault: true,
}

function mapSettings(row) {
  if (!row) return { ...DEFAULT_SETTINGS }
  return {
    storeName: row.store_name || DEFAULT_SETTINGS.storeName,
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    address: row.address || '',
    notifyNewOrders: Boolean(row.notify_new_orders),
    notifyLowStock: Boolean(row.notify_low_stock),
    notifyCancellations: Boolean(row.notify_cancellations),
    sidebarOpenDefault: Boolean(row.sidebar_open_default),
    updatedAt: row.updated_at || null,
  }
}

export async function fetchStoreSettings() {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return mapSettings(data)
}

export async function updateStoreInfo({ storeName, contactEmail, contactPhone, address }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not signed in')

  const { data, error } = await supabase
    .from('store_settings')
    .update({
      store_name: String(storeName || '').trim() || DEFAULT_SETTINGS.storeName,
      contact_email: String(contactEmail || '').trim() || null,
      contact_phone: String(contactPhone || '').trim() || null,
      address: String(address || '').trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) throw error
  return mapSettings(data)
}

export async function updateNotificationSettings({
  notifyNewOrders,
  notifyLowStock,
  notifyCancellations,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not signed in')

  const { data, error } = await supabase
    .from('store_settings')
    .update({
      notify_new_orders: Boolean(notifyNewOrders),
      notify_low_stock: Boolean(notifyLowStock),
      notify_cancellations: Boolean(notifyCancellations),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) throw error
  return mapSettings(data)
}

export async function updateAppPreferences({ sidebarOpenDefault }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('Not signed in')

  const { data, error } = await supabase
    .from('store_settings')
    .update({
      sidebar_open_default: Boolean(sidebarOpenDefault),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) throw error
  return mapSettings(data)
}

export async function changePassword({ currentPassword, newPassword }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user?.email) throw userError || new Error('Not signed in')

  const trimmedNew = String(newPassword || '')
  if (trimmedNew.length < 6) {
    throw new Error('New password must be at least 6 characters')
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) throw new Error('Current password is incorrect')

  const { error } = await supabase.auth.updateUser({ password: trimmedNew })
  if (error) throw error
}
