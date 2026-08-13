import { supabase } from '../lib/supabaseClient'
import { mapProfile } from './profileApi'

export { mapProfile }

export async function getSessionUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  if (!session?.user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profileError) throw profileError
  return mapProfile(profile)
}

export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      callback(null)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    callback(mapProfile(profile))
  })
  return () => subscription.unsubscribe()
}

export async function login({ email, password }) {
  const normalized = String(email).trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  return { ok: true, role: profile.role, user: mapProfile(profile) }
}

export async function register(details) {
  const email = String(details.email).trim().toLowerCase()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: details.password,
    options: {
      data: {
        name: details.contactName,
        phone: details.contactNumber,
        business_name: details.businessName,
      },
    },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  if (!data.user) {
    return { ok: false, error: 'Unable to create account.' }
  }

  return { ok: true }
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
