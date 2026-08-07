// Script: run SQL via Supabase service role using pg endpoint
// Usage: node scripts/run-sql.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kelfndholimoyeyqmckw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlbGZuZGhvbGltb3lleXFtY2t3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAzNTc5MCwiZXhwIjoyMTAxNjExNzkwfQ.oFi1Mr-g1ll8uXti-4CSnJXKZsSdwHCYXyeQCUkIs5M'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Test: try to access user_vehicles
const { data, error } = await supabase
  .from('user_vehicles')
  .select('id')
  .limit(1)

if (error) {
  console.log('user_vehicles error:', error.message)
  console.log('Hint:', error.hint)
} else {
  console.log('✅ user_vehicles accessible! Rows returned:', data.length)
}

// Test payment_settings
const { data: ps, error: psErr } = await supabase
  .from('payment_settings')
  .select('gateway')
  .limit(1)

if (psErr) {
  console.log('payment_settings error:', psErr.message)
} else {
  console.log('✅ payment_settings accessible! Rows:', ps.length)
}
