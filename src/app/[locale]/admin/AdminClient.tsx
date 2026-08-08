'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Users, Store, ShoppingBag, Package, CheckCircle, XCircle, Clock,
  LayoutDashboard, LogOut, AlertCircle, CreditCard, DollarSign, Filter,
  Settings, Globe, Phone, Mail, MapPin, FileText, Save, UserCog, Shield, Trash2,
  Download, TrendingUp, Receipt
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDate, formatAED } from '@/lib/utils'

interface Stats {
  totalUsers: number
  totalOrders: number
  totalProducts: number
  totalVendors: number
}

interface Props {
  locale: string
  adminRole: 'super_admin' | 'admin'
  currentUserEmail: string
  pendingVendors: any[]
  allVendors: any[]
  stats: Stats
}

type Tab = 'overview' | 'pending_vendors' | 'all_vendors' | 'payment' | 'orders' | 'settings' | 'pages' | 'admin_users' | 'vat_report'

// ─── Payment gateway definitions ─────────────────────────────────────────────
const GATEWAYS = [
  { id: 'stripe',  label: 'Stripe',  icon: '💳', desc: 'Credit / Debit Card',   hasWebhook: true },
  { id: 'telr',    label: 'Telr',    icon: '🏦', desc: 'UAE Payment Gateway',   hasWebhook: true },
  { id: 'tabby',   label: 'Tabby',   icon: '📅', desc: 'Pay in 4 — BNPL',       hasWebhook: true },
  { id: 'tamara',  label: 'Tamara',  icon: '📅', desc: 'Pay in 3 — BNPL',       hasWebhook: true },
  { id: 'cod',     label: 'Cash on Delivery', icon: '📦', desc: 'No integration needed', hasWebhook: false },
]

interface GatewaySettings {
  is_enabled: boolean
  is_sandbox: boolean
  public_key: string
  secret_key: string
  webhook_secret: string
}

export default function AdminClient({ locale, adminRole, currentUserEmail, pendingVendors, allVendors, stats }: Props) {
  const ta = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Initialize from SSR props, then refresh via API for real-time data
  const [vendors, setVendors] = useState(pendingVendors)
  const [vendorsList, setVendorsList] = useState(allVendors)
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isSuperAdmin = adminRole === 'super_admin'

  // Fetch latest vendor data from API (uses service role, always fresh)
  const refreshVendors = useCallback(async () => {
    setVendorsLoading(true)
    try {
      const res = await fetch('/api/admin/vendors')
      const json = await res.json()
      if (res.ok) {
        setVendors(json.pendingVendors ?? [])
        setVendorsList(json.allVendors ?? [])
      } else {
        console.error('Vendor API error:', json)
      }
    } catch (err) {
      console.error('Failed to refresh vendors', err)
    } finally {
      setVendorsLoading(false)
    }
  }, [])

  // Refresh vendors when tab is opened
  useEffect(() => {
    if (activeTab === 'pending_vendors' || activeTab === 'all_vendors' || activeTab === 'overview') {
      refreshVendors()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also refresh on mount to get latest data
  useEffect(() => {
    refreshVendors()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin Users state ────────────────────────────────────────────────────────
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersLoaded, setAdminUsersLoaded] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'admin'>('admin')
  const [newAdminPass, setNewAdminPass] = useState('')
  const [addAdminLoading, setAddAdminLoading] = useState(false)
  const [addAdminError, setAddAdminError] = useState('')
  const [addAdminSuccess, setAddAdminSuccess] = useState('')

  // ── Payment settings state ──────────────────────────────────────────────────
  const [globalSandbox, setGlobalSandbox] = useState(true)
  const [gwSettings, setGwSettings] = useState<Record<string, GatewaySettings>>(() => {
    const init: Record<string, GatewaySettings> = {}
    GATEWAYS.forEach(g => {
      init[g.id] = { is_enabled: g.id === 'cod', is_sandbox: true, public_key: '', secret_key: '', webhook_secret: '' }
    })
    return init
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [paymentLoaded, setPaymentLoaded] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  // ── Admin orders state ──────────────────────────────────────────────────────
  const [adminOrders, setAdminOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')

  // ── VAT Report state ──────────────────────────────────────────────────────
  const [vatOrders, setVatOrders] = useState<any[]>([])
  const [vatLoading, setVatLoading] = useState(false)
  const [vatLoaded, setVatLoaded] = useState(false)
  const [vatPeriod, setVatPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
  })

  // ── Pages state ───────────────────────────────────────────────────────────
  const [pages, setPages] = useState<{slug: string; title: string; content: string}[]>([])
  const [activePage, setActivePage] = useState<string>('privacy')
  const [pageContent, setPageContent] = useState<string>('')
  const [pageTitle, setPageTitle] = useState<string>('')
  const [pagesLoading, setPagesLoading] = useState(false)
  const [pagesSaved, setPagesSaved] = useState(false)
  const [pagesLoaded, setPagesLoaded] = useState(false)

  // ── Site settings state ──────────────────────────────────────────────────────
  const [siteSettings, setSiteSettings] = useState({
    platform_name: 'SGO-SouqUAE',
    tagline: "UAE's Premium Auto Parts Marketplace",
    phone: '+971 XX XXX XXXX',
    email: 'support@sgosouquae.com',
    address: 'Dubai, United Arab Emirates',
    whatsapp: '',
    vat_trn: '',
    trade_license: '',
    facebook: '',
    instagram: '',
    twitter: '',
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load payment settings when tab is activated
  const loadPaymentSettings = useCallback(async () => {
    if (paymentLoaded) return
    const { data } = await supabase.from('payment_settings').select('*')
    if (data && data.length > 0) {
      const next = { ...gwSettings }
      let sand = true
      data.forEach((row: any) => {
        next[row.gateway] = {
          is_enabled: row.is_enabled ?? false,
          is_sandbox: row.is_sandbox ?? true,
          public_key: row.public_key ?? '',
          secret_key: row.secret_key ?? '',
          webhook_secret: row.webhook_secret ?? '',
        }
        if (row.is_sandbox === false) sand = false
      })
      setGwSettings(next)
      setGlobalSandbox(sand)
    }
    setPaymentLoaded(true)
  }, [paymentLoaded, supabase, gwSettings])

  // Load admin orders when tab activated
  const loadAdminOrders = useCallback(async () => {
    if (ordersLoaded) return
    setOrdersLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(full_name), vendors(business_name)')
      .order('created_at', { ascending: false })
    setAdminOrders(data ?? [])
    setOrdersLoading(false)
    setOrdersLoaded(true)
  }, [ordersLoaded, supabase])

  useEffect(() => {
    if (activeTab === 'payment') loadPaymentSettings()
    if (activeTab === 'orders') loadAdminOrders()
    if (activeTab === 'settings') loadSiteSettings()
    if (activeTab === 'pages') loadPages()
    if (activeTab === 'admin_users') loadAdminUsers()
    if (activeTab === 'vat_report') loadVatReport()
  }, [activeTab, loadPaymentSettings, loadAdminOrders])

  const loadVatReport = useCallback(async () => {
    setVatLoading(true)
    // Parse quarter
    const [year, q] = vatPeriod.split('-Q')
    const qNum = parseInt(q)
    const startMonth = (qNum - 1) * 3
    const start = new Date(parseInt(year), startMonth, 1).toISOString()
    const end = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('orders')
      .select('*, vendors(business_name, vat_trn)')
      .gte('created_at', start)
      .lte('created_at', end)
      .in('status', ['delivered', 'confirmed', 'processing', 'shipped'])
      .order('created_at', { ascending: false })

    setVatOrders(data ?? [])
    setVatLoading(false)
    setVatLoaded(true)
  }, [vatPeriod, supabase])

  const exportVatCSV = () => {
    if (vatOrders.length === 0) return
    const headers = ['Order #', 'Date', 'Vendor', 'Vendor TRN', 'Subtotal AED', 'VAT 5% AED', 'Total AED', 'Status']
    const rows = vatOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString('en-AE'),
      o.vendors?.business_name ?? '',
      o.vendors?.vat_trn ?? '',
      o.subtotal_aed?.toFixed(2),
      o.vat_amount_aed?.toFixed(2),
      o.total_aed?.toFixed(2),
      o.status,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VAT-Report-${vatPeriod}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadAdminUsers = useCallback(async () => {
    if (adminUsersLoaded) return
    setAdminUsersLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, admin_role, is_active, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
    // Fetch emails via admin API
    const res = await fetch('/api/admin/list-admins')
    const emailMap: Record<string, string> = {}
    if (res.ok) {
      const json = await res.json()
      json.users?.forEach((u: any) => { emailMap[u.id] = u.email })
    }
    // Deduplicate by id and attach email
    const seen = new Set()
    const unique = (data ?? []).filter((u: any) => {
      if (seen.has(u.id)) return false
      seen.add(u.id)
      return true
    }).map((u: any) => ({ ...u, email: emailMap[u.id] || '' }))
    setAdminUsers(unique)
    setAdminUsersLoading(false)
    setAdminUsersLoaded(true)
  }, [adminUsersLoaded, supabase])

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPass || !newAdminName) {
      setAddAdminError('Name, email, and password are required.')
      return
    }
    setAddAdminLoading(true)
    setAddAdminError('')
    setAddAdminSuccess('')

    // Use Supabase admin API via service role — create user + set role
    const res = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newAdminEmail,
        password: newAdminPass,
        full_name: newAdminName,
        admin_role: newAdminRole,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setAddAdminError(json.error || 'Failed to create admin.')
    } else {
      setAddAdminSuccess(`Admin "${newAdminName}" created successfully!`)
      setNewAdminEmail('')
      setNewAdminPass('')
      setNewAdminName('')
      setAdminUsersLoaded(false)
      loadAdminUsers()
    }
    setAddAdminLoading(false)
  }

  const handleToggleAdmin = async (userId: string, isActive: boolean) => {
    await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u))
  }

  const loadPages = useCallback(async () => {
    if (pagesLoaded) return
    const { data } = await supabase.from('pages').select('slug, title, content').order('slug')
    if (data && data.length > 0) {
      setPages(data)
      // Set first page as active
      const firstSlug = data[0].slug
      setActivePage(firstSlug)
      setPageTitle(data[0].title)
      setPageContent(data[0].content)
    } else {
      // Data kosong — reset agar bisa retry
      setPagesLoaded(false)
    }
    setPagesLoaded(true)
  }, [pagesLoaded, supabase])

  const handleSelectPage = (slug: string) => {
    const page = pages.find(p => p.slug === slug)
    if (page) {
      setActivePage(slug)
      setPageTitle(page.title)
      setPageContent(page.content)
    }
  }

  const handleSavePage = async () => {
    setPagesLoading(true)
    await supabase.from('pages').upsert(
      { slug: activePage, title: pageTitle, content: pageContent, updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    )
    setPages(prev => prev.map(p => p.slug === activePage ? { ...p, title: pageTitle, content: pageContent } : p))
    setPagesLoading(false)
    setPagesSaved(true)
    setTimeout(() => setPagesSaved(false), 3000)
  }

  const loadSiteSettings = useCallback(async () => {
    if (settingsLoaded) return
    const { data } = await supabase.from('site_settings').select('*')
    if (data && data.length > 0) {
      const obj: any = {}
      data.forEach((row: any) => { obj[row.key] = row.value })
      setSiteSettings(prev => ({ ...prev, ...obj }))
    }
    setSettingsLoaded(true)
  }, [settingsLoaded, supabase])

  const handleSaveSettings = async () => {
    setSettingsLoading(true)
    for (const [key, value] of Object.entries(siteSettings)) {
      await supabase.from('site_settings').upsert(
        { key, value: String(value) },
        { onConflict: 'key' }
      )
    }
    setSettingsLoading(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  const handleVendorAction = async (vendorId: string, action: 'approved' | 'rejected') => {
    setActionLoading(vendorId)
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action }),
      })
      if (!res.ok) {
        const json = await res.json()
        console.error('Vendor action failed:', json.error)
      }
    } catch (err) {
      console.error('Vendor action error', err)
    }

    // Refresh vendor lists from DB
    await refreshVendors()
    setActionLoading(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
  }

  // Save payment settings
  const handleSavePayment = async () => {
    setPaymentLoading(true)
    for (const [gateway, cfg] of Object.entries(gwSettings)) {
      await supabase.from('payment_settings').upsert({
        gateway,
        is_enabled: cfg.is_enabled,
        is_sandbox: globalSandbox,
        public_key: cfg.public_key || null,
        secret_key: cfg.secret_key || null,
        webhook_secret: cfg.webhook_secret || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'gateway' })
    }
    setPaymentLoading(false)
    setPaymentSaved(true)
    setTimeout(() => setPaymentSaved(false), 3000)
  }

  const handleTestConnection = (gatewayId: string) => {
    const cfg = gwSettings[gatewayId]
    if (gatewayId === 'cod') {
      setTestResults(p => ({ ...p, [gatewayId]: '✓ COD requires no API keys.' }))
    } else if (cfg.public_key && cfg.secret_key) {
      setTestResults(p => ({ ...p, [gatewayId]: '✓ Keys are configured. (Simulation)' }))
    } else {
      setTestResults(p => ({ ...p, [gatewayId]: '✗ API keys are missing.' }))
    }
  }

  const updateGw = (id: string, field: keyof GatewaySettings, value: string | boolean) => {
    setGwSettings(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: ta('dashboard') },
    { id: 'pending_vendors', icon: Clock, label: ta('pendingVendors'), badge: vendors.length },
    { id: 'all_vendors', icon: Store, label: ta('vendors') },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'vat_report', icon: Receipt, label: 'VAT Report', superOnly: true },
    { id: 'payment', icon: CreditCard, label: 'Payment', superOnly: true },
    { id: 'pages', icon: FileText, label: 'Pages', superOnly: true },
    { id: 'settings', icon: Settings, label: 'Site Settings', superOnly: true },
    { id: 'admin_users', icon: UserCog, label: 'Admin Users', superOnly: true },
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
              // Hide super-only tabs for regular admin
              if ((item as any).superOnly && !isSuperAdmin) return null
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
                  {(item as any).badge ? (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {(item as any).badge}
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
                { label: ta('totalVendors'), value: vendorsList.length || stats.totalVendors, icon: Store, color: 'text-gold-600 bg-gold-50' },
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-midnight-700">
                {vendors.length} pending application{vendors.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={refreshVendors}
                disabled={vendorsLoading}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-midnight-500 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
              >
                {vendorsLoading ? (
                  <span className="w-3 h-3 border border-midnight-400 border-t-transparent rounded-full animate-spin" />
                ) : '↻'} Refresh
              </button>
            </div>
            {vendorsLoading && vendors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center luxury-shadow">
                <span className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
                <p className="text-sm text-midnight-400">Loading...</p>
              </div>
            ) : vendors.length === 0 ? (
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-midnight-700">All Vendors ({vendorsList.length})</p>
              <button
                onClick={refreshVendors}
                disabled={vendorsLoading}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-midnight-500 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
              >
                {vendorsLoading ? (
                  <span className="w-3 h-3 border border-midnight-400 border-t-transparent rounded-full animate-spin" />
                ) : '↻'} Refresh
              </button>
            </div>
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
                {vendorsLoading && vendorsList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-midnight-400">
                    <span className="inline-block w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  </td></tr>
                ) : vendorsList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-midnight-400">No vendors yet</td></tr>
                ) : vendorsList.map((vendor: any) => (
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

        {/* ── Orders Overview (Task 10) ─────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {/* GMV */}
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <p className="text-xs text-midnight-400 uppercase tracking-wide">Total GMV</p>
                <p className="text-2xl font-heading font-bold text-midnight-900">
                  {formatAED(adminOrders.reduce((s, o) => s + (o.total_aed ?? 0), 0))}
                </p>
              </div>
              {/* Filter */}
              <div className="ms-auto flex items-center gap-2">
                <Filter className="w-4 h-4 text-midnight-400" />
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gold-400 bg-gray-50"
                >
                  <option value="all">All Status</option>
                  {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Order #</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Customer</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Vendor</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Total</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Status</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adminOrders
                      .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                      .map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-midnight-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-midnight-700">{order.profiles?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-midnight-700">{order.vendors?.business_name ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-midnight-900">{formatAED(order.total_aed)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-midnight-400">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                    {adminOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-midnight-400">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Payment Settings (Task 3) ─────────────────────────────────────── */}
        {activeTab === 'payment' && (
          <div className="space-y-5 max-w-3xl">
            {/* Global sandbox toggle */}
            <div className={`rounded-2xl border p-5 ${globalSandbox ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-midnight-900">
                    {globalSandbox ? '🧪 Sandbox / Test Mode' : '⚠️ PRODUCTION MODE — Live transactions'}
                  </p>
                  <p className="text-xs text-midnight-500 mt-0.5">
                    {globalSandbox
                      ? 'No real charges. Safe for testing integrations.'
                      : 'Real money will be charged. Ensure all keys are correct!'}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium text-midnight-600">{globalSandbox ? 'Sandbox' : 'Production'}</span>
                  <div className="relative" onClick={() => setGlobalSandbox(p => !p)}>
                    <div className={`w-12 h-6 rounded-full transition-colors ${globalSandbox ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${globalSandbox ? '' : 'translate-x-6'}`} />
                  </div>
                </label>
              </div>
              {!globalSandbox && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-xl text-sm text-red-700 font-medium">
                  ⚠️ Production mode is active. All enabled payment methods will process real transactions.
                </div>
              )}
            </div>

            {/* Per-gateway settings */}
            {GATEWAYS.map(gw => {
              const cfg = gwSettings[gw.id]
              const isConfigured = gw.id === 'cod' || (!!cfg.public_key && !!cfg.secret_key)
              return (
                <div key={gw.id} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gw.icon}</span>
                      <div>
                        <p className="font-semibold text-midnight-900">{gw.label}</p>
                        <p className="text-xs text-midnight-400">{gw.desc}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ms-2 ${
                        isConfigured ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {isConfigured ? '● Connected' : '○ Not Configured'}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-midnight-500">{cfg.is_enabled ? 'Enabled' : 'Disabled'}</span>
                      <div className="relative" onClick={() => updateGw(gw.id, 'is_enabled', !cfg.is_enabled)}>
                        <div className={`w-10 h-5 rounded-full transition-colors ${cfg.is_enabled ? 'bg-gold-500' : 'bg-gray-200'}`} />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cfg.is_enabled ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>

                  {gw.id !== 'cod' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-midnight-600">Public Key / API Key</label>
                        <input
                          type="text"
                          value={cfg.public_key}
                          onChange={e => updateGw(gw.id, 'public_key', e.target.value)}
                          placeholder="pk_test_..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-gold-400 bg-gray-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-midnight-600">Secret Key</label>
                        <input
                          type="password"
                          value={cfg.secret_key}
                          onChange={e => updateGw(gw.id, 'secret_key', e.target.value)}
                          placeholder="sk_test_..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-gold-400 bg-gray-50"
                        />
                      </div>
                      {gw.hasWebhook && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-midnight-600">Webhook Secret</label>
                          <input
                            type="password"
                            value={cfg.webhook_secret}
                            onChange={e => updateGw(gw.id, 'webhook_secret', e.target.value)}
                            placeholder="whsec_..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-gold-400 bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleTestConnection(gw.id)}
                      className="text-xs px-4 py-1.5 rounded-xl border border-gray-200 text-midnight-600 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Test Connection
                    </button>
                    {testResults[gw.id] && (
                      <span className={`text-xs font-medium ${testResults[gw.id].startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                        {testResults[gw.id]}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Save button */}
            <button
              onClick={handleSavePayment}
              disabled={paymentLoading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {paymentLoading
                ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              {paymentSaved ? 'Settings Saved!' : 'Save Settings'}
            </button>
          </div>
        )}

        {/* ── VAT Report ───────────────────────────────────────────────── */}
        {activeTab === 'vat_report' && isSuperAdmin && (
          <div className="space-y-5 max-w-4xl">
            {/* Quarter selector */}
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-midnight-900">VAT Report</p>
                    <p className="text-xs text-midnight-400">UAE FTA Quarterly Report — 5% VAT</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={vatPeriod}
                    onChange={e => { setVatPeriod(e.target.value); setVatLoaded(false) }}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50"
                  >
                    {['2026-Q1','2026-Q2','2026-Q3','2026-Q4','2025-Q4','2025-Q3'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button onClick={loadVatReport}
                    className="px-4 py-2 rounded-xl gold-gradient text-midnight-900 text-sm font-bold hover:opacity-90">
                    Load
                  </button>
                  <button onClick={exportVatCSV} disabled={vatOrders.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50 disabled:opacity-40">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              {vatOrders.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
                  {[
                    {
                      label: 'Total Taxable Amount',
                      value: formatAED(vatOrders.reduce((s, o) => s + (o.subtotal_aed || 0), 0)),
                      color: 'text-blue-600 bg-blue-50'
                    },
                    {
                      label: 'Total VAT Collected (5%)',
                      value: formatAED(vatOrders.reduce((s, o) => s + (o.vat_amount_aed || 0), 0)),
                      color: 'text-green-600 bg-green-50'
                    },
                    {
                      label: 'Total Revenue incl. VAT',
                      value: formatAED(vatOrders.reduce((s, o) => s + (o.total_aed || 0), 0)),
                      color: 'text-gold-600 bg-gold-50'
                    },
                  ].map(card => (
                    <div key={card.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-midnight-400 mb-1">{card.label}</p>
                      <p className={`text-xl font-heading font-bold ${card.color.split(' ')[0]}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Table */}
            {vatLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : vatOrders.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Order #</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Date</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Vendor</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">TRN</th>
                      <th className="text-end px-4 py-3 font-semibold text-midnight-600">Subtotal</th>
                      <th className="text-end px-4 py-3 font-semibold text-midnight-600">VAT 5%</th>
                      <th className="text-end px-4 py-3 font-semibold text-midnight-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vatOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-midnight-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-xs text-midnight-500">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-midnight-700">{order.vendors?.business_name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-midnight-500">{order.vendors?.vat_trn ?? '—'}</td>
                        <td className="px-4 py-3 text-end text-midnight-700">{formatAED(order.subtotal_aed)}</td>
                        <td className="px-4 py-3 text-end text-green-600 font-medium">{formatAED(order.vat_amount_aed)}</td>
                        <td className="px-4 py-3 text-end font-semibold text-midnight-900">{formatAED(order.total_aed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : vatLoaded ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-midnight-400">
                No orders found for {vatPeriod}
              </div>
            ) : null}
          </div>
        )}

        {/* ── Admin Users (Super Admin only) ───────────────────────── */}
        {activeTab === 'admin_users' && isSuperAdmin && (
          <div className="space-y-6 max-w-3xl">
            {/* Role info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gold-50 border border-gold-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-gold-600" />
                  <p className="font-semibold text-midnight-900">Super Admin</p>
                </div>
                <ul className="text-xs text-midnight-600 space-y-1">
                  <li>✅ All access — vendors, orders, payment</li>
                  <li>✅ Edit pages & site settings</li>
                  <li>✅ Create & manage admin accounts</li>
                  <li>✅ Full platform control</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <UserCog className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-midnight-900">Admin</p>
                </div>
                <ul className="text-xs text-midnight-600 space-y-1">
                  <li>✅ Vendor approval & management</li>
                  <li>✅ View & manage orders</li>
                  <li>❌ No payment / pages / settings</li>
                  <li>❌ No admin user management</li>
                </ul>
              </div>
            </div>

            {/* Add new admin */}
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
              <h2 className="font-heading font-semibold text-midnight-900 mb-5 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-gold-500" /> Create New Admin Account
              </h2>
              {addAdminError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{addAdminError}</div>
              )}
              {addAdminSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{addAdminSuccess}</div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Full Name *</label>
                  <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)}
                    placeholder="Ahmad Al Rashidi"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Email *</label>
                  <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                    placeholder="admin@sgosouquae.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Password *</label>
                  <input type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Admin Role *</label>
                  <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value as 'super_admin' | 'admin')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    <option value="admin">Admin (Vendor & Orders only)</option>
                    <option value="super_admin">Super Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddAdmin} disabled={addAdminLoading}
                className="mt-5 flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
                {addAdminLoading
                  ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                  : <UserCog className="w-4 h-4" />}
                Create Admin Account
              </button>
            </div>

            {/* Admin users list */}
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-heading font-semibold text-midnight-900">All Admin Accounts</h2>
              </div>
              {adminUsersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Name</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Email</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Role</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Status</th>
                      <th className="text-start px-4 py-3 font-semibold text-midnight-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adminUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-midnight-400">No admin accounts found</td></tr>
                    ) : adminUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-midnight-900">{u.full_name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-midnight-500 font-mono">{u.email || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.admin_role === 'super_admin'
                              ? 'bg-gold-50 text-gold-700 border border-gold-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {u.admin_role === 'super_admin' ? '⭐ Super Admin' : '👤 Admin'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.id !== undefined && (
                            <button
                              onClick={() => handleToggleAdmin(u.id, u.is_active)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                u.is_active
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Pages Editor ──────────────────────────────────────────────── */}
        {activeTab === 'pages' && (
          <div className="space-y-5 max-w-4xl">
            {/* Page selector */}
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { slug: 'privacy', label: '🔒 Privacy Policy' },
                { slug: 'returns', label: '🔄 Return Policy' },
                { slug: 'terms', label: '📄 Terms of Service' },
                { slug: 'help', label: '❓ Help Center' },
              ].map(p => (
                <button key={p.slug} onClick={() => handleSelectPage(p.slug)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activePage === p.slug
                      ? 'gold-gradient text-midnight-900'
                      : 'border border-gray-200 bg-white text-midnight-600 hover:border-gold-300'
                  }`}>
                  {p.label}
                </button>
              ))}
              {pages.length === 0 && (
                <button onClick={() => { setPagesLoaded(false); loadPages() }}
                  className="px-3 py-2 rounded-xl text-xs border border-gray-200 text-midnight-500 hover:bg-gray-50">
                  ↻ Reload
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Page Title</label>
                <input type="text" value={pageTitle}
                  onChange={e => setPageTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:border-gold-400" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Content</label>
                  <span className="text-xs text-midnight-400">Supports Markdown: ## Heading, ### Subheading, - List, **Bold**</span>
                </div>
                <textarea
                  value={pageContent}
                  onChange={e => setPageContent(e.target.value)}
                  rows={25}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono focus:outline-none focus:border-gold-400 resize-y"
                  placeholder="Write page content here using Markdown..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs text-midnight-400">
                  Changes will be visible immediately on the website after saving.
                </p>
                <button onClick={handleSavePage} disabled={pagesLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {pagesLoading
                    ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                    : <Save className="w-4 h-4" />}
                  {pagesSaved ? 'Saved!' : 'Save Page'}
                </button>
              </div>
            </div>

            {/* Preview hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
              💡 Preview: <strong>/en/{activePage}</strong> — Open in new tab to see the result after saving.
            </div>
          </div>
        )}

        {/* ── Site Settings ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
              <h2 className="font-heading font-semibold text-midnight-900 mb-5 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold-500" /> Platform Information
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Platform Name</label>
                    <input type="text" value={siteSettings.platform_name}
                      onChange={e => setSiteSettings(p => ({ ...p, platform_name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Tagline</label>
                    <input type="text" value={siteSettings.tagline}
                      onChange={e => setSiteSettings(p => ({ ...p, tagline: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <input type="text" value={siteSettings.address}
                    onChange={e => setSiteSettings(p => ({ ...p, address: e.target.value }))}
                    placeholder="Dubai, United Arab Emirates"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Phone
                    </label>
                    <input type="text" value={siteSettings.phone}
                      onChange={e => setSiteSettings(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+971 XX XXX XXXX"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">WhatsApp</label>
                    <input type="text" value={siteSettings.whatsapp}
                      onChange={e => setSiteSettings(p => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="+971 XX XXX XXXX"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Support Email
                    </label>
                    <input type="email" value={siteSettings.email}
                      onChange={e => setSiteSettings(p => ({ ...p, email: e.target.value }))}
                      placeholder="support@sgosouquae.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">VAT / TRN Number</label>
                    <input type="text" value={siteSettings.vat_trn}
                      onChange={e => setSiteSettings(p => ({ ...p, vat_trn: e.target.value }))}
                      placeholder="100XXXXXXXXX00003"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Trade License No.</label>
                    <input type="text" value={siteSettings.trade_license}
                      onChange={e => setSiteSettings(p => ({ ...p, trade_license: e.target.value }))}
                      placeholder="DED-XXXX-XXXXXX"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
              <h2 className="font-heading font-semibold text-midnight-900 mb-5">Social Media</h2>
              <div className="space-y-3">
                {[
                  { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/sgosouquae' },
                  { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/sgosouquae' },
                  { key: 'twitter', label: 'X / Twitter URL', placeholder: 'https://x.com/sgosouquae' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">{field.label}</label>
                    <input type="url" value={(siteSettings as any)[field.key]}
                      onChange={e => setSiteSettings(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={settingsLoading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
              {settingsLoading
                ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />}
              {settingsSaved ? 'Settings Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
