'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, FileText, CreditCard, ArrowRight, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const EMIRATES = ['dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah']
const BUSINESS_TYPES = ['retailer','wholesaler','distributor','manufacturer']

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Legal Documents', icon: FileText },
  { id: 3, label: 'Bank Details', icon: CreditCard },
]

export default function VendorOnboardingPage() {
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const te = useTranslations('emirates')
  const tv = useTranslations('vendor')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    business_name_ar: '',
    business_type: 'retailer',
    emirate: 'dubai',
    address: '',
    trade_license_no: '',
    trade_license_expiry: '',
    vat_trn: '',
    bank_name: '',
    bank_iban: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }

    const { error } = await supabase.from('vendors').insert({
      user_id: user.id,
      business_name: form.business_name,
      business_name_ar: form.business_name_ar || null,
      business_type: form.business_type,
      emirate: form.emirate,
      address: form.address,
      trade_license_no: form.trade_license_no,
      trade_license_expiry: form.trade_license_expiry,
      vat_trn: form.vat_trn || null,
      bank_name: form.bank_name || null,
      bank_iban: form.bank_iban || null,
      status: 'pending',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update profile role to vendor
    await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id)

    router.push(`/${locale}/vendor/dashboard`)
  }

  return (
    <div className="min-h-screen bg-warm-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-heading font-bold text-midnight-900 text-xl">
              SGO<span className="gold-text">Souq</span>UAE
            </span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-midnight-900">Become a Vendor</h1>
          <p className="text-midnight-500 text-sm mt-1">Join UAE's premium auto parts marketplace</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'gold-gradient text-midnight-900' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${isActive ? 'text-gold-700' : 'text-midnight-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl luxury-shadow border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg font-bold text-midnight-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold-500" />
                Business Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Business Name (English) *</label>
                  <input name="business_name" value={form.business_name} onChange={handleChange} required
                    placeholder="Al Futtaim Auto Parts" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Business Name (Arabic)</label>
                  <input name="business_name_ar" value={form.business_name_ar} onChange={handleChange} dir="rtl"
                    placeholder="الفطيم لقطع السيارات" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50 font-arabic" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Business Type *</label>
                  <select name="business_type" value={form.business_type} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50">
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Emirate *</label>
                  <select name="emirate" value={form.emirate} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50">
                    {EMIRATES.map(e => <option key={e} value={e}>{te(e as any)}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-midnight-700">Business Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={3}
                  placeholder="Shop 12, Al Quoz Industrial Area, Dubai"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50 resize-none" />
              </div>
            </div>
          )}

          {/* Step 2: Legal Documents */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg font-bold text-midnight-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-500" />
                Legal Documents
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Trade License Number *</label>
                  <input name="trade_license_no" value={form.trade_license_no} onChange={handleChange} required
                    placeholder="DED-123456" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">License Expiry Date *</label>
                  <input name="trade_license_expiry" type="date" value={form.trade_license_expiry} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-midnight-700">VAT / TRN Number <span className="text-midnight-400 font-normal">(optional — if registered)</span></label>
                <input name="vat_trn" value={form.vat_trn} onChange={handleChange}
                  placeholder="100XXXXXXXXX00003" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
              </div>

              <div className="p-4 bg-gold-50 border border-gold-200 rounded-xl">
                <p className="text-sm text-gold-800 font-medium mb-1">📋 Document Upload</p>
                <p className="text-xs text-gold-700">Trade License document upload will be available after initial approval. Our team will contact you via email.</p>
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading text-lg font-bold text-midnight-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-500" />
                Bank Details <span className="text-sm font-normal text-midnight-400">(for payouts)</span>
              </h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-midnight-700">Bank Name</label>
                <input name="bank_name" value={form.bank_name} onChange={handleChange}
                  placeholder="Emirates NBD, FAB, ADCB..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-midnight-700">IBAN Number</label>
                <input name="bank_iban" value={form.bank_iban} onChange={handleChange}
                  placeholder="AE XXXXXXXXXXXXXXXXXXXXXXXXX" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-gold-400 bg-gray-50" />
                <p className="text-xs text-midnight-400">UAE IBAN format: AE + 21 digits</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700">💡 Bank details can be skipped for now and added later from your vendor dashboard. Weekly payouts are processed every Monday.</p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-sm font-semibold text-midnight-800">Application Summary</p>
                <div className="text-xs text-midnight-600 space-y-1">
                  <p>• <strong>Business:</strong> {form.business_name || '—'}</p>
                  <p>• <strong>Type:</strong> {form.business_type}</p>
                  <p>• <strong>Emirate:</strong> {te(form.emirate as any)}</p>
                  <p>• <strong>Trade License:</strong> {form.trade_license_no || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-midnight-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !form.business_name) { setError('Business name is required'); return }
                  if (step === 2 && (!form.trade_license_no || !form.trade_license_expiry)) { setError('Trade license details are required'); return }
                  setError('')
                  setStep(s => s + 1)
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
