'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Car, Wrench, Phone, MapPin, Clock, CheckCircle,
  AlertCircle, Loader2, ChevronRight, Package, Star
} from 'lucide-react'
import type { VehicleMake, VehicleModel, Emirates } from '@/types'

const EMIRATES: { value: Emirates; label: string }[] = [
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu_dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ajman', label: 'Ajman' },
  { value: 'rak', label: 'Ras Al Khaimah' },
  { value: 'uaq', label: 'Umm Al Quwain' },
  { value: 'fujairah', label: 'Fujairah' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 35 }, (_, i) => CURRENT_YEAR - i)

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal (3-5 days)', icon: '📦' },
  { value: 'urgent', label: 'Urgent (same day)', icon: '⚡' },
  { value: 'flexible', label: 'Flexible (no rush)', icon: '🕐' },
]

type Step = 1 | 2 | 3

export default function RFQPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const supabase = createClient()

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [rfqNumber, setRfqNumber] = useState('')

  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const [form, setForm] = useState({
    // Vehicle
    make: '',
    model: '',
    year: String(CURRENT_YEAR),
    trim: '',
    // Part
    part_name: '',
    part_number: '',
    oem_code: '',
    description: '',
    quantity: '1',
    urgency: 'normal',
    // Contact
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    emirate: 'dubai' as Emirates,
    notes: '',
  })

  useEffect(() => {
    // Load makes
    supabase.from('vehicle_makes').select('*').eq('is_active', true).order('name')
      .then(({ data }) => setMakes(data ?? []))

    // Pre-fill contact info if logged in
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, emirate')
        .eq('id', user.id)
        .single()
      if (profile) {
        setForm(prev => ({
          ...prev,
          contact_name: profile.full_name ?? '',
          contact_phone: profile.phone ?? '',
          contact_email: user.email ?? '',
          emirate: (profile.emirate as Emirates) ?? 'dubai',
        }))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load models when make changes
  useEffect(() => {
    if (!form.make) { setModels([]); return }
    setLoadingModels(true)
    const selectedMake = makes.find(m => m.name === form.make)
    if (!selectedMake) { setLoadingModels(false); return }
    supabase.from('vehicle_models').select('*').eq('make_id', selectedMake.id).order('model_name')
      .then(({ data }) => { setModels(data ?? []); setLoadingModels(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.make, makes])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.contact_name || !form.contact_phone) {
      setError('Name and phone are required.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: insertError } = await supabase
      .from('rfq_requests')
      .insert({
        customer_id: user?.id ?? null,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        trim: form.trim || null,
        part_name: form.part_name,
        part_number: form.part_number || null,
        oem_code: form.oem_code || null,
        description: form.description || null,
        quantity: Number(form.quantity),
        urgency: form.urgency,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email || null,
        emirate: form.emirate,
        notes: form.notes || null,
        status: 'open',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setRfqNumber(data.id.slice(0, 8).toUpperCase())
    setSuccess(true)
    setLoading(false)
  }

  const validateStep = (s: Step): boolean => {
    setError('')
    if (s === 1) {
      if (!form.make) { setError('Please select a vehicle make.'); return false }
      return true
    }
    if (s === 2) {
      if (!form.part_name.trim()) { setError('Part name is required.'); return false }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) setStep(prev => (prev + 1) as Step)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="bg-white rounded-2xl luxury-shadow border border-gray-100 p-10">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-2">Request Submitted!</h2>
            <p className="text-midnight-500 text-sm mb-4">
              Your RFQ <strong className="font-mono text-gold-600">#{rfqNumber}</strong> has been submitted.
              Vendors will review and get back to you within 24 hours.
            </p>
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-sm font-semibold text-gold-800">What happens next?</p>
              <div className="space-y-1.5 text-xs text-gold-700">
                <p>1. Verified vendors receive your request</p>
                <p>2. They respond with price & availability</p>
                <p>3. You compare quotes and choose the best</p>
                <p>4. Place order directly on the platform</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href={`/${locale}/catalog`}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50 text-center">
                Browse Catalog
              </Link>
              <Link href={`/${locale}`}
                className="flex-1 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm text-center hover:opacity-90">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Header */}
      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Request a Part</h1>
              <p className="text-midnight-400 text-sm">Can't find what you need? Ask our vendors directly.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: '📝', title: 'Describe', desc: 'Tell us what part you need' },
              { icon: '📬', title: 'Vendors Quote', desc: 'Get offers from verified vendors' },
              { icon: '✅', title: 'Choose & Order', desc: 'Pick the best price' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-midnight-300">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <p className="font-semibold text-white">{s.title}</p>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {([
            { id: 1, label: 'Vehicle', icon: Car },
            { id: 2, label: 'Part Details', icon: Wrench },
            { id: 3, label: 'Contact', icon: Phone },
          ] as const).map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'gold-gradient text-midnight-900' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${
                    isActive ? 'text-gold-700' : isDone ? 'text-green-600' : 'text-midnight-400'
                  }`}>{s.label}</span>
                </div>
                {i < 2 && <div className={`w-12 h-0.5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* ── Step 1: Vehicle ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-midnight-900 text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-gold-500" /> Your Vehicle
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Make <span className="text-red-500">*</span></label>
                  <select value={form.make} onChange={e => { set('make', e.target.value); set('model', '') }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    <option value="">Select Make</option>
                    {makes.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Model</label>
                  <select value={form.model} onChange={e => set('model', e.target.value)}
                    disabled={!form.make || loadingModels}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400 disabled:opacity-60">
                    <option value="">{loadingModels ? 'Loading...' : 'Select Model'}</option>
                    {models.map(m => <option key={m.id} value={m.model_name}>{m.model_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Year <span className="text-red-500">*</span></label>
                  <select value={form.year} onChange={e => set('year', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Trim / Variant</label>
                  <input type="text" value={form.trim} onChange={e => set('trim', e.target.value)}
                    placeholder="e.g. EX, Sport, V6 GCC"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
              </div>

              {/* Popular makes quick select */}
              <div>
                <p className="text-xs font-semibold text-midnight-500 mb-2">Popular Makes:</p>
                <div className="flex flex-wrap gap-2">
                  {['Toyota', 'Nissan', 'Mitsubishi', 'Honda', 'Kia', 'Hyundai', 'Land Rover', 'BMW'].map(m => (
                    <button key={m} type="button"
                      onClick={() => { set('make', m); set('model', '') }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.make === m
                          ? 'gold-gradient text-midnight-900 border-gold-400'
                          : 'border-gray-200 text-midnight-600 hover:border-gold-300 bg-white'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Part Details ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-midnight-900 text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gold-500" /> Part Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-midnight-700">Part Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.part_name} onChange={e => set('part_name', e.target.value)}
                    placeholder="e.g. Front Brake Pads, Oil Filter, Shock Absorber..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Part Number <span className="text-midnight-400 font-normal">(if known)</span></label>
                  <input type="text" value={form.part_number} onChange={e => set('part_number', e.target.value)}
                    placeholder="e.g. 04465-60080"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">OEM Code <span className="text-midnight-400 font-normal">(if known)</span></label>
                  <input type="text" value={form.oem_code} onChange={e => set('oem_code', e.target.value)}
                    placeholder="e.g. 15208-31U0B"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Quantity</label>
                  <input type="number" min="1" max="999" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Urgency</label>
                  <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    {URGENCY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-midnight-700">Additional Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                    placeholder="Any additional details about the part, condition, or specific requirements..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400 resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Contact ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold text-midnight-900 text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-gold-500" /> Contact Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                    placeholder="Abdul Waheed"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                    placeholder="+971 55 XXX XXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Email</label>
                  <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-midnight-700">Emirate</label>
                  <select value={form.emirate} onChange={e => set('emirate', e.target.value as Emirates)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400">
                    {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-midnight-700">Notes for Vendors</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                    placeholder="Any specific requirements, preferred brands, budget range..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold-400 resize-none" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-gold-800 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Request Summary
                </p>
                <div className="text-xs text-gold-700 space-y-1">
                  <p>🚗 <strong>{form.year} {form.make} {form.model}</strong>{form.trim ? ` — ${form.trim}` : ''}</p>
                  <p>🔧 <strong>{form.part_name || '—'}</strong>{form.part_number ? ` (P/N: ${form.part_number})` : ''}</p>
                  <p>📦 Qty: <strong>{form.quantity}</strong> | Urgency: <strong>{URGENCY_OPTIONS.find(o => o.value === form.urgency)?.label}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
            <button onClick={() => setStep(prev => (prev - 1) as Step)} disabled={step === 1}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-midnight-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Back
            </button>

            {step < 3 ? (
              <button onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  : <><CheckCircle className="w-4 h-4" /> Submit Request</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[
            { icon: Star, title: 'Verified Vendors', desc: 'All vendors are verified with UAE Trade License', color: 'text-gold-500 bg-gold-50' },
            { icon: Clock, title: 'Fast Response', desc: 'Get quotes within 24 hours from multiple vendors', color: 'text-blue-500 bg-blue-50' },
            { icon: CheckCircle, title: 'Free Service', desc: 'Requesting a quote is completely free', color: 'text-green-500 bg-green-50' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.title} className="bg-white rounded-2xl border border-gray-100 p-4 luxury-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="font-semibold text-midnight-900 text-sm mb-1">{card.title}</p>
                <p className="text-xs text-midnight-400">{card.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}
