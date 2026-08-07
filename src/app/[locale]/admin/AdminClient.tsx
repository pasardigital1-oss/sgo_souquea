'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Users, Store, ShoppingBag, Package, CheckCircle, XCircle, Clock, LayoutDashboard, LogOut, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface Stats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalVendors: number
}

interface Props {
  locale: string
  pendingVendors: any[]
  allVendors: any[]
  stats: Stats
}

type Tab = 'overview' | 'pending_vendors' | 'all_vendors'

export default function AdminClient({ locale, pendingVendors, allVendors, stats }: Props) {
  const ta = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [vendors, setVendors] = useState(pendingVendors)
  const router = useRouter()
  const supabase = createClient()

  const handleVendorAction = async (vendorId: string, action: 'approved' | 'rejected') => {
    setActionLoading(vendorId)
    await supabase.from('vendors').update({
      status: action,
      approved_at: action === 'approved' ? new Date().toISOString() : null,
    }).eq('id', vendorId)

    setVendors(prev => prev.filter(v => v.id !== vendorId))
    setActionLoading(null)
    router.refresh()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
  }

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: ta('dashboard') },
    { id: 'pending_vendors', icon: Clock, label: ta('pendingVendors'), badge: vendors.length },
    { id: 'all_vendors', icon: Store, label: ta('vendors') },
  ]

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
            <div>
              <span className="font-heading font-bold text-white text-sm block">SGO<span className="gold-text">Souq</span></span>
              <span className="text-midnight-500 text-[10px] uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map(item => {
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
                  <span className="flex-1 text-start">{item.label}</span>
                  {item.badge ? (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-5 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-midnight-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <h1 className="font-heading text-2xl font-bold text-midnight-900 mb-6">{ta('title')}</h1>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: ta('totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: ta('totalVendors'), value: stats.totalVendors, icon: Store, color: 'text-gold-600 bg-gold-50' },
                { label: ta('orders'), value: stats.totalOrders, icon: ShoppingBag, color: 'text-green-600 bg-green-50' },
                { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600 bg-purple-50' },
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

            {vendors.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <p className="text-sm text-orange-700">
                  <strong>{vendors.length} vendor applications</strong> waiting for review.{' '}
                  <button onClick={() => setActiveTab('pending_vendors')} className="underline font-medium">Review now →</button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pending vendors */}
        {activeTab === 'pending_vendors' && (
          <div className="space-y-4">
            {vendors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center luxury-shadow">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-midnight-700">All caught up!</p>
                <p className="text-sm text-midnight-400 mt-1">No pending vendor applications.</p>
              </div>
            ) : vendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 p-6 luxury-shadow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-midnight-900 text-lg">{vendor.business_name}</h3>
                      {vendor.business_name_ar && (
                        <span className="text-midnight-500 text-sm font-arabic">{vendor.business_name_ar}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-midnight-500">
                      <span>📋 License: <strong className="text-midnight-800">{vendor.trade_license_no}</strong></span>
                      <span>📅 Expiry: <strong className="text-midnight-800">{formatDate(vendor.trade_license_expiry)}</strong></span>
                      <span>🏢 Type: <strong className="text-midnight-800 capitalize">{vendor.business_type}</strong></span>
                      <span>📍 {vendor.emirate?.replace('_',' ')}</span>
                    </div>
                    {vendor.vat_trn && (
                      <p className="text-xs text-midnight-500">TRN: <strong>{vendor.vat_trn}</strong></p>
                    )}
                    {vendor.address && (
                      <p className="text-xs text-midnight-400">{vendor.address}</p>
                    )}
                    <p className="text-xs text-midnight-400">Applied: {formatDate(vendor.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVendorAction(vendor.id, 'rejected')}
                      disabled={actionLoading === vendor.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {ta('rejectVendor')}
                    </button>
                    <button
                      onClick={() => handleVendorAction(vendor.id, 'approved')}
                      disabled={actionLoading === vendor.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-midnight-900 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionLoading === vendor.id
                        ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                        : <CheckCircle className="w-4 h-4" />
                      }
                      {ta('approveVendor')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All vendors */}
        {activeTab === 'all_vendors' && (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start px-4 py-3 font-semibold text-midnight-600">Business</th>
                  <th className="text-start px-4 py-3 font-semibold text-midnight-600">Emirates</th>
                  <th className="text-start px-4 py-3 font-semibold text-midnight-600">License</th>
                  <th className="text-start px-4 py-3 font-semibold text-midnight-600">Status</th>
                  <th className="text-start px-4 py-3 font-semibold text-midnight-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allVendors.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-midnight-400">No vendors yet</td></tr>
                ) : allVendors.map((vendor: any) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-midnight-900">{vendor.business_name}</p>
                      <p className="text-xs text-midnight-400 capitalize">{vendor.business_type}</p>
                    </td>
                    <td className="px-4 py-3 text-midnight-600 capitalize">{vendor.emirate?.replace('_',' ')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-midnight-600">{vendor.trade_license_no}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        vendor.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        vendor.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        vendor.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-midnight-400">{formatDate(vendor.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
