'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PartCategory, Emirates, PartType } from '@/types'

const EMIRATES: { value: Emirates; label: string }[] = [
  { value: 'dubai', label: 'Dubai' }, { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' }, { value: 'ajman', label: 'Ajman' },
  { value: 'rak', label: 'Ras Al Khaimah' }, { value: 'uaq', label: 'Umm Al Quwain' },
  { value: 'fujairah', label: 'Fujairah' },
]
const PART_TYPES: { value: PartType; label: string }[] = [
  { value: 'oem', label: 'OEM' }, { value: 'aftermarket', label: 'Aftermarket' },
  { value: 'remanufactured', label: 'Remanufactured' }, { value: 'used', label: 'Used' },
]
const CONDITIONS = [
  { value: 'new', label: 'New' }, { value: 'used', label: 'Used' }, { value: 'refurbished', label: 'Refurbished' },
]

interface FormData {
  name: string; name_ar: string; description: string; part_number: string
  oem_code: string; brand: string; part_type: PartType; category_id: string
  condition: string; warranty_months: string; weight_kg: string
  price_aed: string; quantity: string; emirate: Emirates
  is_featured: boolean; is_active: boolean
}

export default function VendorEditProductPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const productId = params.id as string

  const [form, setForm] = useState<FormData>({
    name: '', name_ar: '', description: '', part_number: '', oem_code: '',
    brand: '', part_type: 'aftermarket', category_id: '', condition: 'new',
    warranty_months: '12', weight_kg: '', price_aed: '', quantity: '', emirate: 'dubai',
    is_featured: false, is_active: true,
  })
  const [categories, setCategories] = useState<PartCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [inventoryId, setInventoryId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }

      const { data: vendor } = await supabase.from('vendors').select('id,status').eq('user_id', user.id).single()
      if (!vendor || vendor.status !== 'approved') { router.push(`/${locale}/vendor/dashboard`); return }
      setVendorId(vendor.id)

      // Fetch product
      const { data: product, error: pErr } = await supabase
        .from('spare_parts')
        .select('*, inventory(id, price_aed, quantity, emirate)')
        .eq('id', productId)
        .eq('vendor_id', vendor.id)
        .single()

      if (pErr || !product) { router.push(`/${locale}/vendor/dashboard`); return }

      const inv = product.inventory?.[0]
      if (inv) setInventoryId(inv.id)

      setForm({
        name: product.name ?? '', name_ar: product.name_ar ?? '',
        description: product.description ?? '', part_number: product.part_number ?? '',
        oem_code: product.oem_code ?? '', brand: product.brand ?? '',
        part_type: product.part_type ?? 'aftermarket', category_id: product.category_id ? String(product.category_id) : '',
        condition: product.condition ?? 'new', warranty_months: String(product.warranty_months ?? 12),
        weight_kg: product.weight_kg ? String(product.weight_kg) : '',
        price_aed: inv ? String(inv.price_aed) : '', quantity: inv ? String(inv.quantity) : '',
        emirate: inv?.emirate ?? 'dubai', is_featured: product.is_featured ?? false, is_active: product.is_active ?? true,
      })

      const { data: cats } = await supabase.from('part_categories').select('*').eq('is_active', true).order('sort_order')
      setCategories(cats ?? [])
      setPageLoading(false)
    }
    init()
  }, [locale, router, productId])

  const set = (field: keyof FormData, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) return
    setLoading(true); setError(null)

    if (!form.name.trim()) { setError('Product name is required.'); setLoading(false); return }
    if (!form.price_aed || Number(form.price_aed) <= 0) { setError('Valid price is required.'); setLoading(false); return }

    const supabase = createClient()

    const { error: partError } = await supabase.from('spare_parts').update({
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name.trim(), name_ar: form.name_ar.trim() || null,
      description: form.description.trim() || null,
      oem_code: form.oem_code.trim() || null, brand: form.brand.trim() || null,
      part_type: form.part_type, condition: form.condition,
      warranty_months: Number(form.warranty_months) || 0,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      is_active: form.is_active, is_featured: form.is_featured,
    }).eq('id', productId).eq('vendor_id', vendorId)

    if (partError) { setError(partError.message); setLoading(false); return }

    if (inventoryId) {
      await supabase.from('inventory').update({
        emirate: form.emirate, quantity: Number(form.quantity), price_aed: Number(form.price_aed),
      }).eq('id', inventoryId)
    }

    setSuccess(true)
    setTimeout(() => router.push(`/${locale}/vendor/dashboard`), 1500)
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl luxury-shadow p-10 max-w-md w-full text-center border border-gray-100">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-3">Product Updated!</h2>
        <p className="text-midnight-500 text-sm">Redirecting to dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="bg-midnight-900 border-b border-gold-500/20">
        <div className="h-1 gold-gradient" />
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/${locale}/vendor/dashboard`} className="flex items-center gap-2 text-midnight-300 hover:text-gold-400 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="w-px h-4 bg-midnight-700" />
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-500" />
            <h1 className="font-heading font-bold text-white text-lg">Edit Product</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Product Name (EN) <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">اسم المنتج (AR)</label>
                <input type="text" dir="rtl" value={form.name_ar} onChange={e => set('name_ar', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-midnight-700">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 resize-none" />
            </div>
          </section>

          {/* Part Details */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">Part Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Part Number</label>
                <input type="text" value={form.part_number} disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm font-mono text-midnight-500 cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">OEM Code</label>
                <input type="text" value={form.oem_code} onChange={e => set('oem_code', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm font-mono focus:outline-none focus:border-gold-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Brand</label>
                <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Part Type</label>
                <select value={form.part_type} onChange={e => set('part_type', e.target.value as PartType)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400">
                  {PART_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400">
                  <option value="">— Select Category —</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Condition</label>
                <select value={form.condition} onChange={e => set('condition', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400">
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Warranty (months)</label>
                <input type="number" min="0" value={form.warranty_months} onChange={e => set('warranty_months', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Weight (kg)</label>
                <input type="number" min="0" step="0.01" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
            </div>
          </section>

          {/* Inventory & Pricing */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">Inventory &amp; Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Price (AED) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute start-4 top-1/2 -translate-y-1/2 text-sm text-midnight-400 font-medium">AED</span>
                  <input type="number" min="0.01" step="0.01" value={form.price_aed} onChange={e => set('price_aed', e.target.value)}
                    className="w-full ps-14 pe-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Stock Quantity <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Location (Emirate) <span className="text-red-500">*</span></label>
                <select value={form.emirate} onChange={e => set('emirate', e.target.value as Emirates)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400">
                  {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Visibility */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-4">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">Visibility</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { field: 'is_active' as const, label: 'Active Listing', desc: 'Visible to customers' },
                { field: 'is_featured' as const, label: 'Featured Product', desc: 'Show on homepage' },
              ].map(tog => (
                <label key={tog.field} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative" onClick={() => set(tog.field, !form[tog.field])}>
                    <div className={`w-11 h-6 rounded-full transition-colors ${form[tog.field] ? 'bg-gold-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[tog.field] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-midnight-900">{tog.label}</p>
                    <p className="text-xs text-midnight-500">{tog.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pb-8">
            <Link href={`/${locale}/vendor/dashboard`}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60 luxury-shadow">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
