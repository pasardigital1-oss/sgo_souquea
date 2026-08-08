import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Verify caller is super_admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', user.id)
      .single()

    const isSuperAdmin =
      callerProfile?.admin_role === 'super_admin' ||
      user.email === 'pasardigital1@gmail.com'

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admin can create admin accounts' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, full_name, admin_role } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'email, password, and full_name are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Use service role to create user
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'admin' },
    })

    if (createError || !newUser.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 })
    }

    // Update profile — set role=admin and admin_role
    await adminClient.from('profiles').upsert({
      id: newUser.user.id,
      full_name,
      role: 'admin',
      admin_role: admin_role || 'admin',
      is_active: true,
      preferred_lang: 'en',
    }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      message: `Admin account created for ${email}`,
    })
  } catch (err) {
    console.error('[create-admin] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
