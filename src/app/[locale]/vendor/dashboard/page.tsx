import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVendorByUserId, getVendorProducts, getVendorOrders } from '@/lib/supabase/queries'
import VendorDashboardClient from './VendorDashboardClient'

type Props = { params: Promise<{ locale: string }> }

export default async function VendorDashboardPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth/login`)

  const vendor = await getVendorByUserId(user.id)

  // If no vendor profile yet, redirect to onboarding
  if (!vendor) redirect(`/${locale}/vendor/onboarding`)

  const [products, orders] = await Promise.all([
    getVendorProducts(vendor.id),
    getVendorOrders(vendor.id),
  ])

  return (
    <VendorDashboardClient
      vendor={vendor as any}
      products={products as any}
      orders={orders as any}
      locale={locale}
    />
  )
}
