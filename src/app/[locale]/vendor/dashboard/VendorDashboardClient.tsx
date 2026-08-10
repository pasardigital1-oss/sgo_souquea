'use client'

import SiteLogo from '@/components/shared/SiteLogo'

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

  // Local orders state so we can update status without full page reload
  const [orderList, setOrderList] = useState<any[]>(orders as any[])
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const totalRevenue = orderList
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_aed, 0)
  const pendingOrders = orderList.filter(o => o.status === 'pending').length
  const activeProducts = products.filter((p: any) => p.is_active).length
  const lowStockProducts = products.filter((p: any) =>
    p.inventory?.some((i: any) => i.quantity <= i.low_stock_alert)
  ).length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
  }

  // Order status progression
  const NEXT_STATUS: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  }
  const STATUS_ACTIONS: Record<string, string> = {
    pending: 'Confirm Order',
    confirmed: 'Mark Processing',
    processing: 'Mark Shipped',
    shipped: 'Mark Delivered',
  }

  // Tracking number state for when marking as shipped
  const [trackingInput, setTrackingInput] = useState<Record<string, { number: string; courier: string }>>({})
  const [showTrackingForm, setShowTrackingForm] = useState<string | null>(null)

  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return

    // For "Mark Shipped", show tracking form first
    if (nextStatus === 'shipped' && showTrackingForm !== orderId) {
      setShowTrackingForm(orderId)
      return
    }

    setUpdatingOrderId(orderId)
    const now = new Date().toISOString()
    const extra: Record<string, string> = {}
    if (nextStatus === 'confirmed') extra.confirmed_at = now
    if (nextStatus === 'shipped') {
      extra.shipped_at = now
      const tracking = trackingInput[orderId]
      if (tracking?.number) extra.tracking_number = tracking.number
      if (tracking?.courier) extra.courier = tracking.courier
    }
    if (nextStatus === 'delivered') extra.delivered_at = now

    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus, ...extra })
      .eq('id', orderId)

    if (!error) {
      setOrderList(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: nextStatus, ...extra } : o)
      )
      setShowTrackingForm(null)
      // Fire notify
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          type: nextStatus === 'confirmed' ? 'confirmed'
              : nextStatus === 'shipped' ? 'shipped'
              : nextStatus === 'delivered' ? 'delivered'
              : nextStatus,
        }),
      }).catch(console.error)
    }
    setUpdatingOrderId(null)
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
            <img src="https://kelfndholimoyeyqmckw.supabase.co/storage/v1/object/public/site-assets/logo/platform-logo.png" alt="SGO" width={32} height={32} className="rounded-lg object-contain shrink-0" />
            <div>
              <span className="font-heading font-bold text-white text-sm block">SGO<span className="gold-text">Souq</span></span>
              <span className="text-midnight-500 text-[10px] uppercase tracking-widest">Vendor Portal</span>
            </div>
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
                  { label: tv('totalOrders'), value: orderList.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
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
                {orderList.length === 0 ? (
                  <div className="p-10 text-center text-midnight-400 text-sm">No orders yet</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {orderList.slice(0, 5).map((order: any) => (
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
                    <th className="text-start px-4 py-3 font-semibold text-midnight-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orderList.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-midnight-400">No orders yet</td></tr>
                  ) : (
                    orderList.map((order: any) => {
                      const nextAction = STATUS_ACTIONS[order.status]
                      const isUpdating = updatingOrderId === order.id
                      const isShowingTracking = showTrackingForm === order.id
                      return (
                        <>
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-medium text-midnight-900">{order.order_number}</td>
                          <td className="px-4 py-3 text-midnight-500">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || ''}`}>
                                {order.status}
                              </span>
                              {order.tracking_number && (
                                <p className="text-xs text-midnight-400 font-mono">
                                  📦 {order.courier ? `${order.courier}: ` : ''}{order.tracking_number}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-midnight-900">{formatAED(order.total_aed)}</td>
                          <td className="px-4 py-3">
                            {nextAction ? (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gold-gradient text-midnight-900 font-bold text-xs hover:opacity-90 disabled:opacity-60 transition-opacity"
                              >
                                {isUpdating
                                  ? <span className="w-3 h-3 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                                  : <CheckCircle className="w-3 h-3" />
                                }
                                {nextAction}
                              </button>
                            ) : (
                              <span className="text-xs text-midnight-400 italic">
                                {order.status === 'delivered' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                        {/* Tracking form — shown when marking as shipped */}
                        {isShowingTracking && (
                          <tr key={`tracking-${order.id}`}>
                            <td colSpan={5} className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                              <div className="flex flex-wrap items-end gap-3">
                                <p className="text-xs font-semibold text-indigo-800 w-full mb-1">📦 Enter Tracking Info (optional)</p>
                                <div className="space-y-1">
                                  <label className="text-xs text-indigo-700">Courier / Shipping Company</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Aramex, DHL, FedEx"
                                    value={trackingInput[order.id]?.courier ?? ''}
                                    onChange={e => setTrackingInput(prev => ({
                                      ...prev,
                                      [order.id]: { ...prev[order.id], courier: e.target.value, number: prev[order.id]?.number ?? '' }
                                    }))}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white w-48"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-indigo-700">Tracking Number</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1Z999AA10123456784"
                                    value={trackingInput[order.id]?.number ?? ''}
                                    onChange={e => setTrackingInput(prev => ({
                                      ...prev,
                                      [order.id]: { ...prev[order.id], number: e.target.value, courier: prev[order.id]?.courier ?? '' }
                                    }))}
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400 bg-white w-52 font-mono"
                                  />
                                </div>
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, order.status)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-60"
                                >
                                  {isUpdating ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                  Confirm Shipped
                                </button>
                                <button
                                  onClick={() => setShowTrackingForm(null)}
                                  className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 text-xs hover:bg-indigo-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports tab */}
          {activeTab === 'reports' && (() => {
            const delivered = orderList.filter(o => o.status === 'delivered')
            const pending = orderList.filter(o => o.status === 'pending')
            const processing = orderList.filter(o => ['confirmed','processing','shipped'].includes(o.status))
            const cancelled = orderList.filter(o => o.status === 'cancelled')
            const totalRevenue = delivered.reduce((s, o) => s + (o.total_aed ?? 0), 0)
            const totalVAT = delivered.reduce((s, o) => s + (o.vat_amount_aed ?? 0), 0)
            const avgOrder = delivered.length > 0 ? totalRevenue / delivered.length : 0

            // Monthly breakdown (last 6 months)
            const monthlyMap: Record<string, number> = {}
            delivered.forEach(o => {
              const m = new Date(o.created_at).toLocaleDateString('en-AE', { month: 'short', year: '2-digit' })
              monthlyMap[m] = (monthlyMap[m] ?? 0) + (o.total_aed ?? 0)
            })
            const months = Object.entries(monthlyMap).slice(-6)
            const maxRevenue = Math.max(...months.map(([, v]) => v), 1)

            return (
              <div className="space-y-5">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `AED ${totalRevenue.toFixed(2)}`, sub: `${delivered.length} delivered orders`, color: 'text-gold-600 bg-gold-50' },
                    { label: 'VAT Collected (5%)', value: `AED ${totalVAT.toFixed(2)}`, sub: 'Payable to FTA', color: 'text-blue-600 bg-blue-50' },
                    { label: 'Avg Order Value', value: `AED ${avgOrder.toFixed(2)}`, sub: 'Per delivered order', color: 'text-purple-600 bg-purple-50' },
                    { label: 'Pending Orders', value: String(pending.length), sub: `${processing.length} in progress`, color: 'text-orange-600 bg-orange-50' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <p className="font-heading font-bold text-lg text-midnight-900">{card.value}</p>
                      <p className="text-xs font-semibold text-midnight-700 mt-0.5">{card.label}</p>
                      <p className="text-xs text-midnight-400 mt-0.5">{card.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Order status breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
                  <h3 className="font-heading font-semibold text-midnight-900 mb-4">Order Status Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Delivered', count: delivered.length, color: 'bg-green-500' },
                      { label: 'In Progress', count: processing.length, color: 'bg-blue-500' },
                      { label: 'Pending', count: pending.length, color: 'bg-yellow-500' },
                      { label: 'Cancelled', count: cancelled.length, color: 'bg-red-400' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="text-sm text-midnight-600 w-24">{row.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`${row.color} h-2 rounded-full transition-all`}
                            style={{ width: orderList.length > 0 ? `${(row.count / orderList.length) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-midnight-900 w-6 text-right">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly revenue bar chart */}
                {months.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
                    <h3 className="font-heading font-semibold text-midnight-900 mb-4">Monthly Revenue</h3>
                    <div className="flex items-end gap-3 h-32">
                      {months.map(([month, revenue]) => (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-midnight-600 font-medium">AED {(revenue/1000).toFixed(1)}k</span>
                          <div
                            className="w-full gold-gradient rounded-t-lg"
                            style={{ height: `${(revenue / maxRevenue) * 80}px`, minHeight: '4px' }}
                          />
                          <span className="text-[10px] text-midnight-400">{month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top products */}
                {products.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-heading font-semibold text-midnight-900">Your Products</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-start px-4 py-3 font-semibold text-midnight-600">Product</th>
                          <th className="text-start px-4 py-3 font-semibold text-midnight-600">Part #</th>
                          <th className="text-start px-4 py-3 font-semibold text-midnight-600">Stock</th>
                          <th className="text-start px-4 py-3 font-semibold text-midnight-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.slice(0, 10).map((p: any) => {
                          const stock = p.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0
                          const isLow = p.inventory?.some((i: any) => i.quantity <= (i.low_stock_alert ?? 5))
                          return (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-midnight-900 max-w-[200px] truncate">{p.name}</td>
                              <td className="px-4 py-3 font-mono text-xs text-midnight-500">{p.part_number}</td>
                              <td className="px-4 py-3 text-midnight-700">{stock}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  !p.is_active ? 'bg-gray-100 text-gray-500' :
                                  isLow ? 'bg-red-50 text-red-600 border border-red-200' :
                                  'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                  {!p.is_active ? 'Inactive' : isLow ? 'Low Stock' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </main>
    </div>
  )
}
