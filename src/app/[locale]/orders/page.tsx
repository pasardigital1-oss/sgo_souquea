import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomerOrders } from '@/lib/supabase/queries'
import OrdersClient from './OrdersClient'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ success?: string }>
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { success } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/auth/login`)

  const orders = await getCustomerOrders(user.id)

  return <OrdersClient orders={orders as any} locale={locale} showSuccess={success === 'true'} />
}
