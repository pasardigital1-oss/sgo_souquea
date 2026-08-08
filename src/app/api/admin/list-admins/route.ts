import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Verify caller is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all admin profile IDs
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (!profiles?.length) return NextResponse.json({ users: [] })

    // Fetch auth users to get emails
    const { data: { users }, error } = await adminClient.auth.admin.listUsers()
    if (error) return NextResponse.json({ users: [] })

    const adminIds = new Set(profiles.map((p: any) => p.id))
    const adminUsers = users
      .filter(u => adminIds.has(u.id))
      .map(u => ({ id: u.id, email: u.email }))

    return NextResponse.json({ users: adminUsers })
  } catch (err) {
    console.error('[list-admins]', err)
    return NextResponse.json({ users: [] })
  }
}
