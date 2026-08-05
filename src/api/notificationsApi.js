import { supabase } from '../lib/supabaseClient'

function mapNotification(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
    unread: !row.read_at,
  }
}

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data.map(mapNotification)
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (error) throw error
}

export async function notifyAdmins({ title, body, type = 'order', link = '/admin/orders' }) {
  const { error } = await supabase.rpc('notify_admins', {
    p_title: title,
    p_body: body,
    p_type: type,
    p_link: link,
  })
  if (error) throw error
}

export async function notifyUser({ userId, title, body, type = 'info', link = null }) {
  const { error } = await supabase.rpc('notify_user', {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_type: type,
    p_link: link,
  })
  if (error) throw error
}
