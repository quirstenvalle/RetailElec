import { supabase } from '../lib/supabaseClient'

async function invokeFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let detail = error.message || `Unable to call ${name}`
    try {
      if (error.context && typeof error.context.json === 'function') {
        const payload = await error.context.json()
        detail = payload?.error || detail
      }
    } catch {
      // keep original message
    }
    throw new Error(detail)
  }
  if (data?.error) {
    const err = new Error(data.error)
    err.awaiting = Boolean(data.awaiting)
    throw err
  }
  return data
}

export async function createCheckout({ deliveryMode, returnOrigin }) {
  return invokeFunction('create-checkout', { deliveryMode, returnOrigin })
}

export async function confirmCheckout(referenceNumber) {
  return invokeFunction('confirm-checkout', { referenceNumber })
}
