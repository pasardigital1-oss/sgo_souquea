import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingVendors, getAllVendors } from '@/lib/supabase/queries'
import AdminClient from './AdminClient'

type Props = { params: Promise<{ locale: string }> }

export default async function AdminPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' ||
                  user.user_metadata?.role === 'admin' ||
                  user.email === 'pasardigital1@gmail.com'

  if (!isAdmin) redirect(`/${locale}`)

  // Determine admin role — default to 'admin' if not set, bootstrap email = super_admin
  const adminRole: 'super_admin' | 'admin' =
    profile?.admin_role === 'super_admin' ||
    user.email === 'pasardigital1@gmail.com'
      ? 'super_admin'
      : 'admin'

  const [pendingVendors, allVendors] = await Promise.all([
    getPendingVendors(),
    getAllVendors(),
  ])

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  const { count: totalProducts } = await supabase.from('spare_parts').select('*', { count: 'exact', head: true })

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
