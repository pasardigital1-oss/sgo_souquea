'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3, Settings,
  Plus, TrendingUp, AlertCircle, CheckCircle, Clock, LogOut
} from 'lucide-react'
import { formatAED } from '@/lib/utils'
import type { Vendor, SparePart, Order } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  vendor: Vendor
  products: SparePart[]
  orders: Order[]
  locale: string
}

type Tab = 'overview' | 'products' | 'orders' | 'reports'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function VendorDashboardClient({ vendor, products, orders, locale }: Props) {
  const tv = useTranslations('vendor')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const router = useRouter()
  const supabase = createClient()

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_aed, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const activeProducts = products.filter((p: any) => p.is_active).length
  const lowStockProducts = products.filter((p: any) =>
    p.inventory?.some((i: any) => i.quantity <= i.low_stock_alert)
  ).length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
  }

  // Vendor pending approval
  if (vendor.status === 'pending') {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl luxury-shadow p-10 max-w-md w-full text-center border border-gray-100">
          <Clock className="w-14 h-14 text-gold-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-3">Under Review</h2>
          <p className="text-midnight-500 text-sm leading-relaxed mb-2">
            Your vendor application is being reviewed by our team.
          </p>
          <p className="text-midnight-400 text-xs">This usually takes 1-2 business days.</p>
        </div>
      </div>
    )
  }

  if (vendor.status === 'rejected') {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl luxury-shadow p-10 max-w-md w-full text-center border border-red-100">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-3">Application Rejected</h2>
          <p className="text-midnight-500 text-sm mb-3">{vendor.rejection_reason || 'Your application was not approved.'}</p>
          <Link href={`/${locale}/vendor/onboarding`} className="text-gold-600 text-sm font-medium hover:underline">
            Reapply →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-midnight-900 min-h-screen flex flex-col shrink-0">
        <div className="h-1 gold-gradient" />
        <div className="p-5">
          <Link href={`/${locale}`} className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-heading font-bold text-white text-sm">
              SGO<span className="gold-text">Souq</span>
            </span>
          </Link>

          {/* Vendor info */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
            <p className="text-white font-semibold text-sm truncate">{vendor.business_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs capitalize">{vendor.status}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {([
              { id: 'overview', icon: LayoutDashboard, label: tv('dashboardTitle') },
              { id: 'products', icon: Package, label: tv('products') },
              { id: 'orders', icon: ShoppingBag, label: useTranslations('orders')('title') },
              { id: 'reports', icon: BarChart3, label: tv('reports') },
            ] as const).map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      : 'text-midnight-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-5 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-midnight-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {useTranslations('nav')('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl font-bold text-midnight-900">{tv('dashboardTitle')}</h1>
            {activeTab === 'products' && (
              <Link
                href={`/${locale}/vendor/products/new`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                {tv('addProduct')}
              </Link>
            )}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: tv('totalSales'), value: formatAED(totalRevenue), icon: TrendingUp, color: 'text-gold-600 bg-gold-50' },
                  { label: tv('totalOrders'), value: orders.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
                  { label: tv('activeProducts'), value: activeProducts, icon: Package, color: 'text-green-600 bg-green-50' },
                  { label: tv('pendingOrders'), value: pendingOrders, icon: Clock, color: 'text-orange-600 bg-orange-50' },
                ].map(stat => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 luxury-shadow">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-heading font-bold text-midnight-900">{stat.value}</p>
                      <p className="text-sm text-midnight-500 mt-0.5">{stat.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* Low stock alert */}
              {lowStockProducts > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-700">
                    <strong>{lowStockProducts} products</strong> are running low on stock.{' '}
                    <button onClick={() => setActiveTab('products')} className="underline">Review inventory →</button>
                  </p>
                </div>
              )}

              {/* Recent orders */}
              <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow">
                <div className="p-5 border-b border-gray-50">
                  <h2 className="font-heading font-semibold text-midnight-900">Recent Orders</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-midnight-400 text-sm">No orders yet</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-midnight-900 text-sm">{order.order_number}</p>
                          <p className="text-xs text-midnight-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || ''}`}>
                          {order.status}
                        </span>
                        <p className="font-semibold text-midnight-900 text-sm shrink-0">
                          {formatAED(order.total_aed)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products tab */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">{tv('productName')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">{tv('partNumber')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">{tv('price')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">{tv('stock')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">{tv('status')}</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-midnight-400">
                        No products yet.{' '}
                        <Link href={`/${locale}/vendor/products/new`} className="text-gold-600 font-medium hover:underline">
                          Add your first product →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    products.map((product: any) => {
                      const price = product.inventory?.[0]?.price_aed
                      const stock = product.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-midnight-900 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-midnight-400">{product.brand}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-midnight-600">{product.part_number}</td>
                          <td className="px-4 py-3 font-semibold text-midnight-900">
                            {price ? formatAED(price) : '—'}
                          </td>
                          <td className={`px-4 py-3 font-medium ${stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                            {stock}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                            }`}>
                              {product.is_active ? tv('active') : tv('inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/${locale}/vendor/products/${product.id}/edit`}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gold-200 text-gold-700 hover:bg-gold-50 transition-colors font-medium"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Order #</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Date</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Status</th>
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-midnight-400">No orders yet</td></tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium text-midnight-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-midnight-500">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-midnight-900">{formatAED(order.total_aed)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports tab */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-semibold text-midnight-700 mb-2">Reports & Analytics</h3>
              <p className="text-midnight-400 text-sm">Detailed reports coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
