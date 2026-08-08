'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Search, Car, CheckCircle, AlertCircle, Loader2, ChevronRight, Info } from 'lucide-react'

interface VINResult {
  vin: string
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  engine: string | null
  fuel_type: string | null
  transmission: string | null
  body_type: string | null
  drive_type: string | null
  country: string | null
  manufacturer: string | null
}

const SAMPLE_VINS = [
  { vin: 'JN8AY2ND4H9700001', label: 'Nissan Patrol 2017' },
  { vin: '1HGCV1F30JA800001', label: 'Honda Accord 2018' },
  { vin: '4T1BF1FK5EU800001', label: 'Toyota Camry 2014' },
]

export default function VINDecoderPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()

  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VINResult | null>(null)
  const [error, setError] = useState('')

  const handleDecode = async () => {
    const vinClean = vin.trim().toUpperCase()
    if (vinClean.length !== 17) {
      setError('VIN must be exactly 17 characters.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/vin/${vinClean}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'VIN not found. Try a different VIN.')
        return
      }

      setResult(json.data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFindParts = () => {
    if (!result) return
    const params = new URLSearchParams()
    if (result.make) params.set('make', result.make.toLowerCase())
    if (result.model) params.set('model', result.model)
    if (result.year) params.set('year', String(result.year))
    router.push(`/${locale}/catalog?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Header */}
      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gold-gradient mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">VIN Decoder</h1>
          <p className="text-midnight-400 text-sm max-w-md mx-auto">
            Enter your 17-character Vehicle Identification Number to identify your vehicle and find compatible spare parts instantly.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* VIN Input */}
        <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-8 mb-6">
          <label className="block text-sm font-semibold text-midnight-700 mb-2">
            Vehicle Identification Number (VIN)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleDecode()}
              maxLength={17}
              placeholder="e.g. JN8AY2ND4H9700001"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono tracking-widest focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 uppercase placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              onClick={handleDecode}
              disabled={loading || vin.length !== 17}
              className="flex items-center gap-2 px-6 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Decode
            </button>
          </div>

          {/* Character counter */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-midnight-400">
              {vin.length}/17 characters
              {vin.length === 17 && <span className="text-green-500 ms-2">✓ Valid length</span>}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 17 }, (_, i) => (
                <div key={i} className={`w-2 h-1 rounded-full transition-colors ${
                  i < vin.length ? 'bg-gold-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Sample VINs */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-midnight-400 mb-2">Try sample VINs:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_VINS.map(s => (
                <button
                  key={s.vin}
                  onClick={() => setVin(s.vin)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-midnight-600 hover:border-gold-300 hover:bg-gold-50 transition-all font-mono"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
            {/* Success header */}
            <div className="bg-midnight-900 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-heading font-bold text-white text-lg">
                    {result.year} {result.make} {result.model}
                  </p>
                  <p className="text-midnight-400 text-xs font-mono">{result.vin}</p>
                </div>
              </div>
              <button
                onClick={handleFindParts}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90"
              >
                Find Parts
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Details grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Make', value: result.make },
                  { label: 'Model', value: result.model },
                  { label: 'Year', value: result.year },
                  { label: 'Trim', value: result.trim || '—' },
                  { label: 'Engine', value: result.engine || '—' },
                  { label: 'Fuel Type', value: result.fuel_type || '—' },
                  { label: 'Transmission', value: result.transmission || '—' },
                  { label: 'Body Type', value: result.body_type || '—' },
                  { label: 'Drive Type', value: result.drive_type || '—' },
                  { label: 'Country of Mfg', value: result.country || '—' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-midnight-400 mb-1">{item.label}</p>
                    <p className="font-semibold text-midnight-900 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Data sourced from NHTSA (National Highway Traffic Safety Administration). 
                  GCC-spec vehicles may show US-equivalent specifications. 
                  Always verify with your vehicle manual for UAE-specific parts.
                </p>
              </div>

              <button
                onClick={handleFindParts}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90"
              >
                <Search className="w-4 h-4" />
                Find Compatible Parts for This Vehicle
              </button>
            </div>
          </div>
        )}

        {/* How to find VIN */}
        {!result && (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
            <h2 className="font-heading font-semibold text-midnight-900 mb-4">Where to Find Your VIN?</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: '🚗', title: 'Dashboard', desc: "Look through the windshield at the driver's side dashboard corner" },
                { icon: '🚪', title: 'Door Jamb', desc: "Check the driver's side door jamb or door edge sticker" },
                { icon: '📄', title: 'Documents', desc: 'Find it on your vehicle registration, insurance, or title documents' },
              ].map(item => (
                <div key={item.title} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-midnight-900 text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-midnight-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
