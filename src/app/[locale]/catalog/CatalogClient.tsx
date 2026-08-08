'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown, Car, Truck, Bus } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shared/ProductCard'
import { createClient } from '@/lib/supabase/client'
import type { SparePart, PartCategory, VehicleMake, CatalogFilters } from '@/types'

interface Props {
  locale: string
  initialProducts: SparePart[]
  totalCount: number
  categories: PartCategory[]
  makes: VehicleMake[]
  filters: CatalogFilters
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const PART_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'oem', label: 'OEM' },
  { value: 'aftermarket', label: 'Aftermarket' },
  { value: 'remanufactured', label: 'Remanufactured' },
]

const VEHICLE_TYPES = [
  { value: '', label: 'All Vehicles', icon: '🚗' },
  { value: 'sedan', label: 'Car / Sedan', icon: '🚗' },
  { value: 'suv', label: 'SUV / 4WD', icon: '🚙' },
  { value: 'pickup', label: 'Pickup', icon: '🛻' },
  { value: 'van', label: 'Van / Bus', icon: '🚐' },
  { value: 'truck', label: 'Truck', icon: '🚚' },
  { value: 'heavy', label: 'Heavy Equipment', icon: '🚜' },
]

export default function CatalogClient({ locale, initialProducts, totalCount, categories, makes, filters }: Props) {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const searchRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState(filters.q || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '')
  const [selectedMake, setSelectedMake] = useState(filters.make || '')
  const [selectedType, setSelectedType] = useState(filters.part_type || '')
  const [selectedVehicleType, setSelectedVehicleType] = useState('')
  const [selectedYear, setSelectedYear] = useState(filters.year?.toString() || '')
  const [sort, setSort] = useState(filters.sort || 'newest')

  // Predictive search
  const [suggestions, setSuggestions] = useState<{ name: string; part_number: string; brand: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)

  const applyFilters = (overrides: Partial<CatalogFilters> = {}) => {
    const params = new URLSearchParams()
    const merged = {
      q: search,
      category: selectedCategory,
      make: selectedMake,
      type: selectedType,
      vehicle_type: selectedVehicleType,
      year: selectedYear,
      sort,
      ...overrides
    }
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
    router.push(`${pathname}?${params.toString()}`)
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedMake('')
    setSelectedType('')
    setSelectedVehicleType('')
    setSelectedYear('')
    setSort('newest')
    setSuggestions([])
    router.push(pathname)
  }

  // Predictive search
  useEffect(() => {
    if (search.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setSuggestLoading(true)
      const { data } = await supabase
        .from('spare_parts')
        .select('name, part_number, brand')
        .eq('is_active', true)
        .or(`name.ilike.%${search}%,part_number.ilike.%${search}%,brand.ilike.%${search}%`)
        .limit(6)
      setSuggestions(data ?? [])
      setSuggestLoading(false)
      setShowSuggestions(true)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasActiveFilters = search || selectedCategory || selectedMake || selectedType || selectedVehicleType || selectedYear

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="font-heading text-2xl font-bold text-white">
            {t('catalog')}
            {totalCount > 0 && (
              <span className="ms-3 text-sm font-normal text-midnight-400">
                {totalCount.toLocaleString()} parts found
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Vehicle Type Quick Filter */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {VEHICLE_TYPES.map(vt => (
            <button
              key={vt.value}
              onClick={() => { setSelectedVehicleType(vt.value); applyFilters({ vehicle_type: vt.value } as any) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedVehicleType === vt.value
                  ? 'gold-gradient text-midnight-900'
                  : 'border border-gray-200 bg-white text-midnight-600 hover:border-gold-300'
              }`}
            >
              <span>{vt.icon}</span>
              {vt.label}
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Predictive Search */}
          <div className="relative flex-1 min-w-[200px]" ref={searchRef}>
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
              onKeyDown={e => { if (e.key === 'Enter') applyFilters(); if (e.key === 'Escape') setShowSuggestions(false) }}
              onFocus={() => search.length >= 2 && setShowSuggestions(true)}
              placeholder={tc('searchPlaceholder')}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
            {/* Suggestions dropdown */}
            {showSuggestions && (search.length >= 2) && (
              <div className="absolute top-full start-0 end-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                {suggestLoading ? (
                  <div className="px-4 py-3 text-xs text-midnight-400">Searching...</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-midnight-400">No suggestions found</div>
                ) : (
                  suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setSearch(s.name); setShowSuggestions(false); applyFilters({ q: s.name }) }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gold-50 transition-colors text-start"
                    >
                      <div>
                        <p className="text-sm font-medium text-midnight-900">{s.name}</p>
                        <p className="text-xs text-midnight-400 font-mono">{s.part_number}</p>
                      </div>
                      {s.brand && (
                        <span className="text-xs text-gold-600 font-semibold shrink-0 ms-2">{s.brand}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => { const v = e.target.value as NonNullable<CatalogFilters['sort']>; setSort(v); applyFilters({ sort: v }) }}
              className="appearance-none ps-3 pe-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold-400 text-midnight-700"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? 'border-gold-400 bg-gold-50 text-gold-700' : 'border-gray-200 bg-white text-midnight-700 hover:border-gold-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-gold-500" />}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600">
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}

          <button
            onClick={() => applyFilters()}
            className="px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {tc('search')}
          </button>
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 luxury-shadow">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              {/* Vehicle Make */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Vehicle Make</label>
                <select
                  value={selectedMake}
                  onChange={e => setSelectedMake(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50"
                >
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m.id} value={m.name.toLowerCase()}>{m.name}</option>)}
                </select>
              </div>

              {/* Part type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Part Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50"
                >
                  {PART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">Year</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => applyFilters()}
                className="px-5 py-2 rounded-xl gold-gradient text-midnight-900 text-sm font-bold hover:opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Product grid */}
        {initialProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-heading text-xl font-semibold text-midnight-700 mb-2">No parts found</h3>
            <p className="text-midnight-400 text-sm mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 text-sm font-bold">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {initialProducts.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex justify-center mt-10 gap-2">
            {Array.from({ length: Math.ceil(totalCount / 20) }, (_, i) => i + 1).slice(0, 10).map(page => (
              <button
                key={page}
                onClick={() => applyFilters({ page })}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  (filters.page || 1) === page
                    ? 'gold-gradient text-midnight-900'
                    : 'border border-gray-200 text-midnight-600 hover:border-gold-300 bg-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
