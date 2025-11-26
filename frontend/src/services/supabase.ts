import { createClient } from '@supabase/supabase-js'

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use sessionStorage for tab-specific sessions
// Each tab has its own independent session - opening a new tab requires fresh login
// Sessions persist within the same tab (survive page refresh)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // Tab-specific storage
    autoRefreshToken: true, // Keep session alive in current tab
    persistSession: true, // Persist in same tab on refresh
    detectSessionInUrl: true, // Handle email verification links
    flowType: 'pkce'
  }
})
