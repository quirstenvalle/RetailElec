import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env locally and in Vercel Project Settings → Environment Variables, then redeploy.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://jpunedofchmqquxrntls.supabase.co',
  supabaseAnonKey || '',
)
