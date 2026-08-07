'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Car, Plus, Trash2, Search, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import type { VehicleMake, VehicleModel } from '@/types'

interface UserVehicle {
  id: string
  make_id: number | null
  model_id: number | null
  year: number | null
  trim: string | null
  plate_number: string | null
  nickname: string | null
  created_at: string
  vehicle_makes?: { name: string }
  vehicle_models?: { model_name: string }
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i)

export default function GaragePage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<UserVehicle[]>([])
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    make_id: '', model_id: '', year: String(CURRENT_YEAR),
    trim: '', plate_number: '', nickname: '',
  })

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }
      setUserId(user.id)

      const [{ data: v }, { data: m }] = await Promise.all([
        supabase.from('user_vehicles')
          .select('*, vehicle_makes(name), vehicle_models(model_name)')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vehicle_makes').select('*').eq('is_popular', true).order('name'),
      ])

      setVehicles((v as UserVehicle[]) ?? [])
      setMakes((m as VehicleMake[]) ?? [])
      setPageLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router])

  // Load models when make changes
  useEffect(() => {
    if (!form.make_id) { setModels([]); return }
    supabase.from('vehicle_models').select('*').eq('make_id', Number(form.make_id)).order('model_name')
      .then(({ data }) => setModels((data as VehicleModel[]) ?? []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.make_id])

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (!form.make_id) { setError('Please select a make.'); return }
    setError(''); setSaving(true)

    const { error: insertError } = await supabase.from('user_vehicles').insert({
      user_id: userId,
      make_id: Number(form.make_id),
      model_id: form.model_id ? Number(form.model_id) : null,
      year: Number(form.year),
      trim: form.trim.trim() || null,
      plate_number: form.plate_number.trim() || null,
      nickname: form.nickname.trim() || null,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    // Reload vehicles
    const { data: v } = await supabase.from('user_vehicles')
      .select('*, vehicle_makes(name), vehicle_models(model_name)')
      .eq('user_id', userId).order('created_at', { ascending: false })
    setVehicles((v as UserVehicle[]) ?? [])
    setForm({ make_id: '', model_id: '', year: String(CURRENT_YEAR), trim: '', plate_number: '', nickname: '' })
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('user_vehicles').delete().eq('id', id)
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  const getFindPartsUrl = (v: UserVehicle) => {
    const parts: string[] = []
    if (v.vehicle_makes?.name) parts.push(`make=${encodeURIComponent(v.vehicle_makes.name)}`)
    if (v.vehicle_models?.model_name) parts.push(`model=${encodeURIComponent(v.vehicle_models.model_name)}`)
    if (v.year) parts.push(`year=${v.year}`)
    return `/${locale}/catalog?${parts.join('&')}`
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-warm-50"><Navbar />
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${locale}/profile`} className="flex items-center gap-1.5 text-sm text-midnight-500 hover:text-gold-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-midnight-900">My Garage</h1>
              <p className="text-sm text-midnight-400">Save your vehicles to find matching parts instantly</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>

        {/* Add Vehicle Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 mb-6">
            <h2 className="font-heading font-semibold text-midnight-900 mb-5">Add Vehicle</h2>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Make <span className="text-red-500">*</span></label>
                  <select value={form.make_id} onChange={e => setForm(p => ({ ...p, make_id: e.target.value, model_id: '' }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    <option value="">Select Make</option>
                    {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Model</label>
                  <select value={form.model_id} onChange={e => setForm(p => ({ ...p, model_id: e.target.value }))}
                    disabled={!form.make_id}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400 disabled:opacity-60">
                    <option value="">Select Model</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.model_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Year</label>
                  <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Trim / Notes</label>
                  <input type="text" value={form.trim} onChange={e => setForm(p => ({ ...p, trim: e.target.value }))}
                    placeholder="e.g. EX, Sport, 2.0L"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Plate Number (optional)</label>
                  <input type="text" value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))}
                    placeholder="e.g. D 12345"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Nickname (optional)</label>
                  <input type="text" value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                    placeholder="e.g. My Pickup"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add to Garage
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError('') }}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vehicle list */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-12 text-center">
            <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-midnight-700 mb-2">No vehicles yet</h3>
            <p className="text-sm text-midnight-400 mb-4">Add your vehicles to quickly find compatible parts.</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-midnight-900 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-midnight-900">
                        {v.year} {v.vehicle_makes?.name ?? '—'} {v.vehicle_models?.model_name ?? ''}
                      </p>
                      {v.nickname && <p className="text-xs text-gold-600 font-medium">{v.nickname}</p>}
                      {v.trim && <p className="text-xs text-midnight-400">{v.trim}</p>}
                      {v.plate_number && (
                        <p className="text-xs text-midnight-500 mt-0.5">🔑 {v.plate_number}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(v.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Link href={getFindPartsUrl(v)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gold-400 text-gold-700 font-bold text-sm hover:bg-gold-50 transition-colors">
                  <Search className="w-4 h-4" /> Find Parts
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
