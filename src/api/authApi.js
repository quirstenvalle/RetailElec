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

async function signInProfile({ email, password }) {
  const normalized = String(email).trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    let errMessage = error.message

    if (errMessage.toLowerCase().includes('email not confirmed')) {
      errMessage = 'Your email is not verified yet. Please check your inbox for the confirmation link.'
    } else if (errMessage.toLowerCase().includes('invalid login credentials')) {
      errMessage = 'Invalid email/password, or your email has not been verified yet.'
    }

    return { ok: false, error: errMessage }
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

export async function login({ email, password }) {
  return signInProfile({ email, password })
}

export async function loginAsCustomer({ email, password }) {
  const result = await signInProfile({ email, password })
  if (!result.ok) return result
  if (result.role !== 'customer') {
    await supabase.auth.signOut()
    return {
      ok: false,
      error: 'This sign-in page is for merchant accounts only.',
    }
  }
  return result
}

export async function loginAsAdmin({ email, password }) {
  const result = await signInProfile({ email, password })
  if (!result.ok) return result
  if (result.role !== 'admin') {
    await supabase.auth.signOut()
    return {
      ok: false,
      error: 'Administrator credentials are required for this page.',
    }
  }
  return result
}

export async function register(details) {
  const email = String(details.email).trim().toLowerCase()
  const redirectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register?verified=true`
      : undefined

  const { data, error } = await supabase.auth.signUp({
    email,
    password: details.password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        name: details.contactName,
        phone: details.contactNumber,
        business_name: details.businessName,
        delivery_address: String(details.deliveryAddress || '').trim(),
        delivery_city: String(details.deliveryCity || '').trim(),
        delivery_province: String(details.deliveryProvince || '').trim(),
        delivery_postal_code: String(details.deliveryPostalCode || '').trim(),
      },
    },
  })

  if (error) {
    let errMessage = error.message || 'Unable to create account.'

    if (typeof errMessage === 'string' && errMessage.startsWith('[')) {
      try {
        const parsed = JSON.parse(errMessage)
        errMessage = parsed[0]?.message || 'Rate limit reached.'
      } catch (e) {
        errMessage = 'An unexpected error occurred.'
      }
    } else if (Array.isArray(errMessage)) {
      errMessage = errMessage[0]?.message || 'Rate limit reached.'
    }

    if (typeof errMessage === 'string' && errMessage.toLowerCase().includes('rate limit')) {
      errMessage = 'You are trying too fast. Please wait a few minutes before trying again.'
    }

    return { ok: false, error: errMessage }
  }

  if (!data.user) {
    return { ok: false, error: 'Unable to create account.' }
  }

  return {
    ok: true,
    requiresVerification: !data.session,
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}