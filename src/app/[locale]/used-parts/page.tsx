'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, MapPin, Clock, Tag, Car, Phone,
  Filter, X, CheckCircle, AlertCircle, Loader2, Package, Camera, UploadCloud
} from 'lucide-react'
import { formatAED, formatDate } from '@/lib/utils'
import type { Emirates } from '@/types'

interface UsedPart {
  id: string
  title: string
  description: string | null
  price_aed: number
  condition: string
  make: string | null
  model: string | null
  year: number | null
  emirate: Emirates
  contact_name: string
  contact_phone: string
  images: string[]
  is_active: boolean
  created_at: string
  profiles?: { full_name: string }
}

const EMIRATES: { value: Emirates; label: string }[] = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'rak', label: 'Ras Al Khaimah' },
  { value: 'uaq', label: 'Umm Al Quwain' },
  { value: 'fujairah', label: 'Fujairah' },
]

const CONDITIONS = [
  { value: 'used', label: 'Used' },
  { value: 'good', label: 'Used - Good' },
  { value: 'fair', label: 'Used - Fair' },
  { value: 'for_parts', label: 'For Parts Only' },
]

export default function UsedPartsPage() {
  const params = useParams()
  const locale = params.locale as string
  const supabase = createClient()

  const [listings, setListings] = useState<UsedPart[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostForm, setShowPostForm] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [filterEmirate, setFilterEmirate] = useState('')
  const [postLoading, setPostLoading] = useState(false)
  const [postSuccess, setPostSuccess] = useState(false)
  const [postError, setPostError] = useState('')

  // Image upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    price_aed: '',
    condition: 'used',
    make: '',
    model: '',
    year: '',
    emirate: 'dubai' as Emirates,
    contact_name: '',
    contact_phone: '',
  })

  useEffect(() => {
    loadListings()
    // Pre-fill contact if logged in
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
      if (profile) {
        setForm(prev => ({
          ...prev,
          contact_name: profile.full_name ?? '',
          contact_phone: profile.phone ?? '',
        }))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadListings = async (q?: string, emirate?: string) => {
    setLoading(true)
    let query = supabase
      .from('used_parts_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (q) query = query.ilike('title', `%${q}%`)
    if (emirate) query = query.eq('emirate', emirate)

    const { data } = await query
    setListings((data ?? []) as UsedPart[])
    setLoading(false)
  }

  const handleSearch = () => loadListings(searchQ, filterEmirate)

  const setF = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 4 - photoFiles.length)
    if (newFiles.length === 0) return
    const combined = [...photoFiles, ...newFiles].slice(0, 4)
    setPhotoFiles(combined)
    const previews: string[] = []
    combined.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = e => {
        previews[i] = e.target?.result as string
        if (previews.filter(Boolean).length === combined.length) setPhotoPreviews([...previews])
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadPhotos = async (userId: string): Promise<string[]> => {
    if (photoFiles.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const file of photoFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('used-parts-images').upload(path, file, { upsert: false })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('used-parts-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price_aed || !form.contact_name || !form.contact_phone) {
      setPostError('Please fill in all required fields.')
      return
    }
    setPostLoading(true)
    setPostError('')

    const { data: { user } } = await supabase.auth.getUser()

    // Upload photos if any
    const imageUrls = user ? await uploadPhotos(user.id) : []

    const { error } = await supabase.from('used_parts_listings').insert({
      user_id: user?.id ?? null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price_aed: parseFloat(form.price_aed),
      condition: form.condition,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? parseInt(form.year) : null,
      emirate: form.emirate,
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.trim(),
      images: imageUrls,
      is_active: true,
    })

    if (error) {
      setPostError(error.message)
      setPostLoading(false)
      return
    }

    setPostSuccess(true)
    setShowPostForm(false)
    setPostLoading(false)
    setPhotoFiles([])
    setPhotoPreviews([])
    loadListings()

    setTimeout(() => setPostSuccess(false), 4000)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Header */}
      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-white mb-1">Used Spare Parts</h1>
              <p className="text-midnight-400 text-sm">Buy & sell used auto parts across UAE</p>
            </div>
            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Post a Part
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Success banner */}
        {postSuccess && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700 font-medium">Your listing has been posted successfully!</p>
          </div>
        )}

        {/* Post Form Modal */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl luxury-shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="font-heading font-bold text-midnight-900 text-lg">Post a Used Part</h2>
                <button onClick={() => setShowPostForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePost} className="p-6 space-y-4">
                {postError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />{postError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Part Title <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => setF('title', e.target.value)}
                    placeholder="e.g. Used Front Bumper - Toyota Land Cruiser 200"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Price (AED) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="0.01" value={form.price_aed} onChange={e => setF('price_aed', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Condition</label>
                    <select value={form.condition} onChange={e => setF('condition', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Vehicle Make</label>
                    <input type="text" value={form.make} onChange={e => setF('make', e.target.value)}
                      placeholder="Toyota, Nissan, BMW..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Model</label>
                    <input type="text" value={form.model} onChange={e => setF('model', e.target.value)}
                      placeholder="Land Cruiser, Patrol..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Year</label>
                    <input type="number" min="1980" max="2026" value={form.year} onChange={e => setF('year', e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Location (Emirate)</label>
                    <select value={form.emirate} onChange={e => setF('emirate', e.target.value as Emirates)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                      {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Description</label>
                  <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={3}
                    placeholder="Describe the part condition, reason for selling, any damage..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400 resize-none" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Your Name <span className="text-red-500">*</span></label>
                    <input type="text" value={form.contact_name} onChange={e => setF('contact_name', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-midnight-700">Phone <span className="text-red-500">*</span></label>
                    <input type="tel" value={form.contact_phone} onChange={e => setF('contact_phone', e.target.value)}
                      placeholder="+971 55 XXX XXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                  </div>
                </div>
                {/* Photo Upload */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="text-sm font-semibold text-midnight-700">
                    Photos <span className="text-midnight-400 font-normal">(optional, max 4)</span>
                  </label>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); handlePhotoSelect(e.dataTransfer.files) }}
                    onClick={() => photoFiles.length < 4 && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragOver ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300'
                    } ${photoFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handlePhotoSelect(e.target.files)} />
                    <Camera className="w-6 h-6 text-gold-400 mx-auto mb-1" />
                    <p className="text-xs text-midnight-500">
                      {photoFiles.length >= 4 ? 'Max 4 photos reached' : `Click or drag photos · ${photoFiles.length}/4`}
                    </p>
                  </div>
                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <Image src={src} alt={`Photo ${i+1}`} fill className="object-cover" sizes="25vw" unoptimized />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))
                              setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPostForm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={postLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
                    {postLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Post Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search used parts..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400" />
          </div>
          <select value={filterEmirate} onChange={e => { setFilterEmirate(e.target.value); loadListings(searchQ, e.target.value) }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 text-midnight-700">
            <option value="">All Emirates</option>
            {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
          </select>
          <button onClick={handleSearch}
            className="px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 text-sm font-bold hover:opacity-90">
            Search
          </button>
          {(searchQ || filterEmirate) && (
            <button onClick={() => { setSearchQ(''); setFilterEmirate(''); loadListings() }}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600">
              <X className="w-4 h-4" />Clear
            </button>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 luxury-shadow">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-midnight-700 mb-2">No listings yet</h3>
            <p className="text-midnight-400 text-sm mb-5">Be the first to post a used spare part!</p>
            <button onClick={() => setShowPostForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm">
              <Plus className="w-4 h-4" /> Post a Part
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden hover:border-gold-200 transition-all">
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-midnight-900 to-midnight-700 flex items-center justify-center overflow-hidden relative">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                    />
                  ) : (
                    <Car className="w-12 h-12 text-gold-500/40" />
                  )}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      +{listing.images.length - 1} photos
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-midnight-900 text-sm line-clamp-2">{listing.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      listing.condition === 'used' ? 'bg-orange-50 text-orange-700' :
                      listing.condition === 'good' ? 'bg-green-50 text-green-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {CONDITIONS.find(c => c.value === listing.condition)?.label ?? listing.condition}
                    </span>
                  </div>

                  {(listing.make || listing.model) && (
                    <p className="text-xs text-midnight-500 mb-2 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {[listing.year, listing.make, listing.model].filter(Boolean).join(' ')}
                    </p>
                  )}

                  {listing.description && (
                    <p className="text-xs text-midnight-400 line-clamp-2 mb-3">{listing.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <p className="font-heading font-bold text-midnight-900 text-lg">{formatAED(listing.price_aed)}</p>
                    <div className="flex items-center gap-1 text-xs text-midnight-400">
                      <MapPin className="w-3 h-3" />
                      {EMIRATES.find(e => e.value === listing.emirate)?.label ?? listing.emirate}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-midnight-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(listing.created_at)}
                    </div>
                    <a href={`tel:${listing.contact_phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gold-gradient text-midnight-900 font-bold text-xs hover:opacity-90">
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
