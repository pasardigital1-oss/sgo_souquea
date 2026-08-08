import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getPendingVendors, getAllVendors } from '@/lib/supabase/queries'
import AdminClient from './AdminClient'

type Props = { params: Promise<{ locale: string }> }

export default async function AdminPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth/login`)

  // Use service client to bypass RLS for admin profile check
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role, admin_role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' ||
                  user.user_metadata?.role === 'admin' ||
                  user.email === 'pasardigital1@gmail.com'

  if (!isAdmin) redirect(`/${locale}`)

  const adminRole: 'super_admin' | 'admin' =
    profile?.admin_role === 'super_admin' ||
    user.email === 'pasardigital1@gmail.com'
      ? 'super_admin'
      : 'admin'

  const [pendingVendors, allVendors] = await Promise.all([
    getPendingVendors(),
    getAllVendors(),
  ])

  // Use service client for stats — bypasses RLS, no duplicates
  const [
    { count: totalUsers },
    { count: totalOrders },
    { count: totalProducts },
  ] = await Promise.all([
    serviceClient.from('profiles').select('id', { count: 'exact', head: true }),
    serviceClient.from('orders').select('id', { count: 'exact', head: true }),
    serviceClient.from('spare_parts').select('id', { count: 'exact', head: true }),
  ])

  return (
    <AdminClient
      locale={locale}
      adminRole={adminRole}
      currentUserEmail={user.email ?? ''}
      pendingVendors={pendingVendors as any}
      allVendors={allVendors as any}
      stats={{
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalVendors: allVendors.length
      }}
    />
  )
}
