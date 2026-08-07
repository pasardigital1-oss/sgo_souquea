'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, MapPin, Globe, Save, ArrowRight, ShoppingBag, Store, Shield } from 'lucide-react'
import Link from 'next/link'

const EMIRATES = ['dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah']
const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ar', label: 'العربية', flag: '🇦🇪' },
  { value: 'id', label: 'Indonesia', flag: '🇮🇩' },
]

export default function ProfilePage() {
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    emirate: 'dubai',
    preferred_lang: 'en',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({ ...data, email: user.email })
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          emirate: data.emirate || 'dubai',
          preferred_lang: data.preferred_lang || 'en',
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', profile.id)

    if (error) { setError(error.message); setSaving(false); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-midnight-900 mb-6">My Profile</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Profile card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6 text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4 text-white font-heading font-bold text-2xl shadow-lg">
                {form.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <h2 className="font-heading font-bold text-midnight-900 text-lg">{form.full_name || 'User'}</h2>
              <p className="text-midnight-400 text-sm mt-1">{profile?.email}</p>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  profile?.role === 'admin' ? 'bg-red-50 text-red-700' :
                  profile?.role === 'vendor' ? 'bg-gold-50 text-gold-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {profile?.role === 'admin' && <Shield className="w-3 h-3" />}
                  {profile?.role === 'vendor' && <Store className="w-3 h-3" />}
                  {profile?.role === 'customer' && <User className="w-3 h-3" />}
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                </span>
              </div>

              {/* Quick links */}
              <div className="mt-6 space-y-2">
                <Link href={`/${locale}/orders`}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors text-sm text-midnight-700 hover:text-gold-700">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>My Orders</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link href={`/${locale}/profile/garage`}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors text-sm text-midnight-700 hover:text-gold-700">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <span>My Garage 🚗</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {profile?.role === 'vendor' && (
                  <Link href={`/${locale}/vendor/dashboard`}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gold-50 transition-colors text-sm text-midnight-700 hover:text-gold-700">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Vendor Dashboard</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {profile?.role === 'customer' && (
                  <Link href={`/${locale}/vendor/onboarding`}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gold-50 border border-gold-200 transition-colors text-sm text-gold-700">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Become a Vendor</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {profile?.role === 'admin' && (
                  <Link href={`/${locale}/admin`}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 transition-colors text-sm text-red-700">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
              <h2 className="font-heading font-semibold text-midnight-900 mb-5">Edit Profile</h2>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
              )}
              {saved && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2">
                  ✓ Profile updated successfully!
                </div>
              )}

              <div className="space-y-4">
                {/* Email (read only) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                    <input type="email" value={profile?.email || ''} disabled
                      className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-midnight-400 cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-midnight-400">Email cannot be changed</p>
                </div>

                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                    <input type="text" value={form.full_name}
                      onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-gray-50" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                    <input type="tel" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+971 XX XXX XXXX"
                      className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-gray-50" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Emirate */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-midnight-700">Emirate</label>
                    <div className="relative">
                      <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                      <select value={form.emirate}
                        onChange={e => setForm(p => ({ ...p, emirate: e.target.value }))}
                        className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50 appearance-none">
                        {EMIRATES.map(e => (
                          <option key={e} value={e}>{e.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Language */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-midnight-700">Preferred Language</label>
                    <div className="relative">
                      <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                      <select value={form.preferred_lang}
                        onChange={e => setForm(p => ({ ...p, preferred_lang: e.target.value }))}
                        className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50 appearance-none">
                        {LANGUAGES.map(l => (
                          <option key={l.value} value={l.value}>{l.flag} {l.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2">
                  {saving
                    ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
