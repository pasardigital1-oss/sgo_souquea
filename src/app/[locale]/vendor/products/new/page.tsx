'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Package, Save, AlertCircle, CheckCircle, Loader2, Camera, X, UploadCloud
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PartCategory, Emirates, PartType } from '@/types'

const EMIRATES: { value: Emirates; label: string }[] = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'rak', label: "Ras Al Khaimah" },
  { value: 'uaq', label: 'Umm Al Quwain' },
  { value: 'fujairah', label: 'Fujairah' },
]

const PART_TYPES: { value: PartType; label: string }[] = [
  { value: 'oem', label: 'OEM (Original Equipment Manufacturer)' },
  { value: 'aftermarket', label: 'Aftermarket' },
  { value: 'remanufactured', label: 'Remanufactured' },
  { value: 'used', label: 'Used' },
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]

interface FormData {
  name: string
  name_ar: string
  description: string
  part_number: string
  oem_code: string
  brand: string
  part_type: PartType
  category_id: string
  condition: string
  warranty_months: string
  weight_kg: string
  price_aed: string
  quantity: string
  emirate: Emirates
  is_featured: boolean
  is_active: boolean
}

const defaultForm: FormData = {
  name: '',
  name_ar: '',
  description: '',
  part_number: '',
  oem_code: '',
  brand: '',
  part_type: 'aftermarket',
  category_id: '',
  condition: 'new',
  warranty_months: '12',
  weight_kg: '',
  price_aed: '',
  quantity: '',
  emirate: 'dubai',
  is_featured: false,
  is_active: true,
}

export default function VendorAddProductPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [form, setForm] = useState<FormData>(defaultForm)
  const [categories, setCategories] = useState<PartCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/${locale}/auth/login`)
        return
      }

      // Check vendor status
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('user_id', user.id)
        .single()

      if (vendorError || !vendor) {
        router.push(`/${locale}/vendor/onboarding`)
        return
      }

      if (vendor.status !== 'approved') {
        router.push(`/${locale}/vendor/dashboard`)
        return
      }

      setVendorId(vendor.id)

      // Load categories
      const { data: cats } = await supabase
        .from('part_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      setCategories(cats || [])
      setAuthLoading(false)
    }

    init()
  }, [locale, router])

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Handle photo selection
  const handlePhotoSelect = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - photoFiles.length)
    if (newFiles.length === 0) return

    const validFiles = newFiles.filter(f => f.type.startsWith('image/'))
    if (validFiles.length !== newFiles.length) {
      setError('Only image files are allowed.')
    }

    const combined = [...photoFiles, ...validFiles].slice(0, 5)
    setPhotoFiles(combined)

    // Generate previews
    combined.forEach((file, i) => {
      if (photoPreviews[i]) return
      const reader = new FileReader()
      reader.onload = e => {
        setPhotoPreviews(prev => {
          const next = [...prev]
          next[i] = e.target?.result as string
          return next
        })
      }
      reader.readAsDataURL(file)
    })
    // Rebuild all previews for combined
    const newPreviews: string[] = []
    combined.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = e => {
        newPreviews[i] = e.target?.result as string
        if (newPreviews.filter(Boolean).length === combined.length) {
          setPhotoPreviews([...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Upload photos to Supabase Storage, return public URLs
  const uploadPhotos = async (partNumber: string, vId: string): Promise<string[]> => {
    if (photoFiles.length === 0) return []
    setUploadingPhotos(true)
    const supabase = createClient()
    const urls: string[] = []

    for (const file of photoFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${vId}/${partNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      urls.push(publicUrl)
    }

    setUploadingPhotos(false)
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) return

    setLoading(true)
    setError(null)

    // Validate required fields
    if (!form.name.trim()) { setError('Product name (EN) is required.'); setLoading(false); return }
    if (!form.part_number.trim()) { setError('Part number is required.'); setLoading(false); return }
    if (!form.price_aed || isNaN(Number(form.price_aed)) || Number(form.price_aed) <= 0) {
      setError('Valid price in AED is required.'); setLoading(false); return
    }
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      setError('Valid stock quantity is required.'); setLoading(false); return
    }

    const supabase = createClient()

    // Upload photos first
    const imageUrls = await uploadPhotos(form.part_number.trim(), vendorId)

    // Insert spare_part
    const { data: part, error: partError } = await supabase
      .from('spare_parts')
      .insert({
        vendor_id: vendorId,
        category_id: form.category_id ? Number(form.category_id) : null,
        part_number: form.part_number.trim(),
        oem_code: form.oem_code.trim() || null,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        brand: form.brand.trim() || null,
        part_type: form.part_type,
        condition: form.condition,
        warranty_months: Number(form.warranty_months) || 0,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        images: imageUrls,
        is_active: form.is_active,
        is_featured: form.is_featured,
        vehicle_types: (form as any).vehicle_types ?? [],
      })
      .select('id')
      .single()

    if (partError || !part) {
      setError(partError?.message || 'Failed to save product. Please try again.')
      setLoading(false)
      return
    }

    // Insert inventory
    const { error: invError } = await supabase
      .from('inventory')
      .insert({
        part_id: part.id,
        vendor_id: vendorId,
        emirate: form.emirate,
        quantity: Number(form.quantity),
        reserved_qty: 0,
        price_aed: Number(form.price_aed),
        low_stock_alert: 5,
      })

    if (invError) {
      // Attempt to clean up the spare_part we just created
      await supabase.from('spare_parts').delete().eq('id', part.id)
      setError(invError.message || 'Failed to save inventory. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push(`/${locale}/vendor/dashboard`)
    }, 1500)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl luxury-shadow p-10 max-w-md w-full text-center border border-gray-100">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-3">Product Added!</h2>
          <p className="text-midnight-500 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <div className="bg-midnight-900 border-b border-gold-500/20">
        <div className="h-1 gold-gradient" />
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/${locale}/vendor/dashboard`}
            className="flex items-center gap-2 text-midnight-300 hover:text-gold-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="w-px h-4 bg-midnight-700" />
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-500" />
            <h1 className="font-heading font-bold text-white text-lg">Add New Product</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name EN */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Product Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Front Brake Pad Set"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                  required
                />
              </div>

              {/* Name AR */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  اسم المنتج (بالعربية)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.name_ar}
                  onChange={e => set('name_ar', e.target.value)}
                  placeholder="مثال: طقم فرامل أمامية"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-midnight-700">Description (English)</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the product, fitment, condition, and any notes..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400 resize-none"
              />
            </div>
          </section>

          {/* Part Details */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Part Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Part Number */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Part Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.part_number}
                  onChange={e => set('part_number', e.target.value)}
                  placeholder="e.g. TRW-GDB1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm font-mono focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                  required
                />
              </div>

              {/* OEM Code */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">OEM Code</label>
                <input
                  type="text"
                  value={form.oem_code}
                  onChange={e => set('oem_code', e.target.value)}
                  placeholder="e.g. 04465-06080"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm font-mono focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="e.g. TRW, Bosch, Toyota OEM"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                />
              </div>

              {/* Part Type */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Part Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.part_type}
                  onChange={e => set('part_type', e.target.value as PartType)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all text-midnight-700"
                >
                  {PART_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Category</label>
                <select
                  value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all text-midnight-700"
                >
                  <option value="">— Select Category —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}{cat.name_ar ? ` / ${cat.name_ar}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.condition}
                  onChange={e => set('condition', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all text-midnight-700"
                >
                  {CONDITIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Warranty */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Warranty (months)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={form.warranty_months}
                  onChange={e => set('warranty_months', e.target.value)}
                  placeholder="12"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)}
                  placeholder="e.g. 2.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                />
              </div>
            </div>
          </section>

          {/* Inventory & Pricing */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Inventory &amp; Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Price */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Price (AED) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute start-4 top-1/2 -translate-y-1/2 text-sm text-midnight-400 font-medium">AED</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price_aed}
                    onChange={e => set('price_aed', e.target.value)}
                    placeholder="0.00"
                    className="w-full ps-14 pe-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                    required
                  />
                </div>
                {form.price_aed && Number(form.price_aed) > 0 && (
                  <p className="text-xs text-midnight-400">
                    + 5% VAT = AED {(Number(form.price_aed) * 1.05).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
                  required
                />
              </div>

              {/* Emirate */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-midnight-700">
                  Stock Location (Emirate) <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.emirate}
                  onChange={e => set('emirate', e.target.value as Emirates)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-warm-50 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all text-midnight-700"
                >
                  {EMIRATES.map(em => (
                    <option key={em.value} value={em.value}>{em.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Vehicle Compatibility */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-4">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Vehicle Compatibility <span className="text-sm font-normal text-midnight-400">(select all that apply)</span>
            </h2>
            <p className="text-xs text-midnight-400">This helps customers find parts for their vehicle type.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { value: 'car', label: 'Car / Sedan', icon: '🚗' },
                { value: 'suv', label: 'SUV / 4WD', icon: '🚙' },
                { value: 'pickup', label: 'Pickup Truck', icon: '🛻' },
                { value: 'van', label: 'Van / Bus', icon: '🚐' },
                { value: 'truck', label: 'Truck', icon: '🚚' },
                { value: 'heavy', label: 'Heavy Equipment', icon: '🚜' },
              ].map(vt => {
                const selected = (form as any).vehicle_types?.includes(vt.value)
                return (
                  <label
                    key={vt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        const current = (form as any).vehicle_types ?? []
                        const updated = selected
                          ? current.filter((v: string) => v !== vt.value)
                          : [...current, vt.value]
                        setForm(prev => ({ ...prev, vehicle_types: updated } as any))
                      }}
                    />
                    <span className="text-xl">{vt.icon}</span>
                    <span className={`text-sm font-medium ${selected ? 'text-gold-800' : 'text-midnight-700'}`}>
                      {vt.label}
                    </span>
                    {selected && <span className="ms-auto text-gold-600 text-xs font-bold">✓</span>}
                  </label>
                )
              })}
            </div>
          </section>

          {/* Photo Upload */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-5">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Product Photos <span className="text-sm font-normal text-midnight-400">(max 5)</span>
            </h2>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setIsDragOver(false)
                handlePhotoSelect(e.dataTransfer.files)
              }}
              onClick={() => photoFiles.length < 5 && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-gold-400 bg-gold-50'
                  : 'border-gray-200 hover:border-gold-300 hover:bg-warm-50'
              } ${photoFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handlePhotoSelect(e.target.files)}
              />
              <Camera className="w-10 h-10 text-gold-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-midnight-700 mb-1">
                {isDragOver ? 'Drop images here...' : 'Drag & drop photos or click to browse'}
              </p>
              <p className="text-xs text-midnight-400">
                JPG, PNG, WebP · Max 5 photos · {photoFiles.length}/5 selected
              </p>
              {photoFiles.length < 5 && (
                <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl gold-gradient text-midnight-900 font-semibold text-sm">
                  <UploadCloud className="w-4 h-4" />
                  Upload Photos
                </div>
              )}
            </div>

            {/* Previews */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={src}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="20vw"
                      unoptimized
                    />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gold-500/80 text-white text-[10px] text-center py-0.5 font-bold">
                        MAIN
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removePhoto(i) }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingPhotos && (
              <div className="flex items-center gap-2 text-sm text-gold-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading photos...
              </div>
            )}
          </section>

          {/* Visibility */}
          <section className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 space-y-4">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg border-b border-gray-100 pb-3">
              Visibility Settings
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Is Active */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-gold-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-midnight-900">Active Listing</p>
                  <p className="text-xs text-midnight-500">Product is visible to customers</p>
                </div>
              </label>

              {/* Is Featured */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => set('is_featured', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-gold-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-midnight-900">Featured Product</p>
                  <p className="text-xs text-midnight-500">Show on homepage featured section</p>
                </div>
              </label>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4 pb-8">
            <Link
              href={`/${locale}/vendor/dashboard`}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed luxury-shadow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Product
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
