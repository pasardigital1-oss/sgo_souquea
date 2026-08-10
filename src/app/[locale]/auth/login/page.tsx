'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect based on role
    const role = data.user?.user_metadata?.role
    if (role === 'admin') router.push(`/${locale}/admin`)
    else if (role === 'vendor') router.push(`/${locale}/vendor/dashboard`)
    else router.push(`/${locale}`)
  }

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="flex flex-col items-center gap-1 mb-4">
            <img src="https://kelfndholimoyeyqmckw.supabase.co/storage/v1/object/public/site-assets/logo/platform-logo.png" alt="SGO-SouqUAE" width={80} height={80} className="rounded-2xl object-cover border-2 border-gray-200 shadow-md" />
            <span className="font-heading font-bold text-midnight-900 text-xl">SGO<span className="gold-text">Souq</span>UAE</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-midnight-900">{t('loginTitle')}</h1>
          <p className="text-midnight-500 text-sm mt-1">{t('loginSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl luxury-shadow p-8 border border-gray-100">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-midnight-700">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all bg-gray-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-midnight-700">{t('password')}</label>
                <Link href={`/${locale}/auth/forgot-password`} className="text-xs text-gold-600 hover:text-gold-700">
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full ps-10 pe-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-midnight-400 hover:text-midnight-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
              ) : (
                <>
                  {t('signIn')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider & Google OAuth — handled by UAE team after domain setup */}

          {/* Google login — uncomment when Google OAuth is configured in Supabase (done by UAE team) */}
          {/* 
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/${locale}` } })}
            className="w-full py-3 rounded-xl border border-gray-200 text-midnight-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          */}

          {/* Register link */}
          <p className="text-center text-sm text-midnight-500 mt-5">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/auth/register`} className="text-gold-600 hover:text-gold-700 font-semibold">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
