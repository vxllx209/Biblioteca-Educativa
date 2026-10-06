import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client, or null when the env vars are missing.
 * Without it the app keeps working in local mode (accounts and data in localStorage).
 */
export const supabase = url && key ? createClient(url, key) : null
