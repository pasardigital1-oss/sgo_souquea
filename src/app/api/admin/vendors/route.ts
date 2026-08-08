import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/vendors — returns all vendors with profile info
export async function GET() {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin =
    profile?.role === 'admin' ||
    user.user_metadata?.role === 'admin' ||
    user.email === 'pasardigital1@gmail.com'

  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch all vendors using service client (bypasses RLS)
  const { data: allVendors, error: e1 } = await service
    .from('vendors')
    .select('*, profiles(full_name, id)')
    .order('created_at', { ascending: false })

  const { data: pendingVendors, error: e2 } = await service
    .from('vendors')
    .select('*, profiles(full_name, id)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (e1 || e2) {
    console.error('vendors fetch error', e1, e2)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({
    allVendors: allVendors ?? [],
    pendingVendors: pendingVendors ?? [],
  })
}

// PATCH /api/admin/vendors — approve or reject a vendor
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin =
    profile?.role === 'admin' ||
    user.user_metadata?.role === 'admin' ||
    user.email === 'pasardigital1@gmail.com'

  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { vendorId, action } = await req.json()
  if (!vendorId || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const { error } = await service
    .from('vendors')
    .update({
      status: action,
      approved_at: action === 'approved' ? new Date().toISOString() : null,
      approved_by: action === 'approved' ? user.id : null,
    })
    .eq('id', vendorId)

  if (error) {
    console.error('vendor update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If approved, also update the vendor's profile role to 'vendor'
  if (action === 'approved') {
    const { data: vendor } = await service
      .from('vendors')
      .select('user_id')
      .eq('id', vendorId)
      .single()

    if (vendor?.user_id) {
      await service
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', vendor.user_id)
    }
  }

  return NextResponse.json({ success: true })
}
