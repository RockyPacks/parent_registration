import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')

    // 1️⃣ Sign in with a test account
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'your_test_email@example.com',
      password: 'yourpassword',
    })
    if (loginError) throw loginError
    console.log('✅ Logged in as:', loginData.user.email)

    // 2️⃣ Fetch from a table
    const { data, error } = await supabase.from('applications').select('*').limit(1)
    if (error) throw error

    console.log('✅ Query success:', data)
  } catch (error) {
    console.error('❌ Supabase error:', error)
  }
}
