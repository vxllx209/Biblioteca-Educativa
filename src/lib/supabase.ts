import { createClient } from '@supabase/supabase-js'

// Public values (safe to ship in the browser). Used when the host, e.g. Vercel, has no env vars set.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://orlnrwjvxuetpupcsept.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wijUbEtdSVjUdNJdQPQKbg_M6OkSz0w'

/** Project URL and public key, for the few calls that go around the client (e.g. auth settings). */
export const supabaseUrl = url
export const supabaseKey = key

/**
 * Supabase client, or null when the env vars are missing.
 * Without it the app keeps working in local mode (accounts and data in localStorage).
 */
export const supabase = url && key ? createClient(url, key) : null
