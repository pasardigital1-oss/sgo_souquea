'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LayoutDashboard, ShoppingBag, LogOut, Shield } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const localeNames = { en: 'EN', ar: 'عر', id: 'ID' }
const localeFullNames = { en: 'English', ar: 'العربية', id: 'Indonesia' }

export default function Navbar() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userRole, setUserRole] = useState<string>('customer')
  const [searchQuery, setSearchQuery] = useState('')
  const totalItems = useCartStore((state) => state.totalItems)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Pre-fill search from URL on catalog page
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && pathname.includes('/catalog')) {
      setSearchQuery(q)
    }
  }, [searchParams, pathname])

  const handleSearch = () => {
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/${locale}/catalog?q=${encodeURIComponent(query)}`)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => { if (data) setUserRole(data.role) })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => { if (data) setUserRole(data.role) })
      } else {
        setUserRole('customer')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    router.push(`/${locale}`)
    router.refresh()
  }

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setLangOpen(false)
  }

  const getDashboardUrl = () => {
    if (userRole === 'admin') return `/${locale}/admin`
    if (userRole === 'vendor') return `/${locale}/vendor/dashboard`
    return `/${locale}/profile`
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-gold-200/30 luxury-shadow">
      {/* Top bar */}
      <div className="bg-midnight-900 text-warm-200 text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="hidden sm:block">
            🇦🇪 UAE&apos;s Premium Auto Parts Marketplace
          </span>
          <div className="flex items-center gap-4 ms-auto">
            <span className="text-gold-400">AED</span>
            <span className="text-midnight-400">|</span>
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-warm-200 hover:text-gold-400 transition-colors"
              >
                <span>{localeNames[locale as keyof typeof localeNames]}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute top-full end-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden min-w-[140px] z-50">
                  {(['en', 'ar', 'id'] as const).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={cn(
                        'w-full px-4 py-2.5 text-start text-sm hover:bg-gold-50 transition-colors flex items-center gap-2',
                        locale === loc ? 'text-gold-700 bg-gold-50 font-medium' : 'text-gray-700'
                      )}
                    >
                      {loc === 'ar' && <span>🇦🇪</span>}
                      {loc === 'en' && <span>🇬🇧</span>}
                      {loc === 'id' && <span>🇮🇩</span>}
                      {localeFullNames[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-midnight-900 text-lg leading-none">
                SGO<span className="gold-text">Souq</span>
              </span>
              <span className="block text-midnight-400 text-[10px] leading-none tracking-widest uppercase">
                UAE
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={tc('searchPlaceholder')}
                className="w-full ps-10 pe-12 py-2.5 rounded-full border border-gray-200 bg-warm-100 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
              />
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400 pointer-events-none" />
              <button
                onClick={handleSearch}
                className="absolute end-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full gold-gradient hover:opacity-90 transition-opacity"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5 text-midnight-900" />
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-midnight-700 hover:bg-gold-50 hover:text-gold-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full end-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[180px] z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-xs font-semibold text-midnight-800 truncate">{user.email}</p>
                      <p className="text-xs text-midnight-400 capitalize mt-0.5">{userRole}</p>
                    </div>
                    <Link href={getDashboardUrl()} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-midnight-700 hover:bg-gold-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-gold-500" />
                      {userRole === 'admin' ? 'Admin Panel' : userRole === 'vendor' ? t('dashboard') : t('profile')}
                    </Link>
                    <Link href={`/${locale}/orders`} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-midnight-700 hover:bg-gold-50 transition-colors">
                      <ShoppingBag className="w-4 h-4 text-gold-500" />
                      {t('orders')}
                    </Link>
                    {userRole === 'customer' && (
                      <Link href={`/${locale}/profile/garage`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-midnight-700 hover:bg-gold-50 transition-colors">
                        <span className="text-gold-500">🚗</span>
                        My Garage
                      </Link>
                    )}
                    {userRole === 'admin' && (
                      <Link href={`/${locale}/admin`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-midnight-700 hover:bg-gold-50 transition-colors">
                        <Shield className="w-4 h-4 text-gold-500" />
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50">
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-midnight-700 hover:bg-gold-50 hover:text-gold-700 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
            )}

            <Link
              href={`/${locale}/cart`}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gold-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-midnight-700" />
              {totalItems() > 0 && (
                <span className="absolute top-1 end-1 w-4 h-4 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gold-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-6 pb-3 border-t border-gray-100 pt-2">
          <Link href={`/${locale}`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            {t('home')}
          </Link>
          <Link href={`/${locale}/catalog`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            {t('catalog')}
          </Link>
          <Link href={`/${locale}/catalog?type=oem`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            OEM Parts
          </Link>
          <Link href={`/${locale}/catalog?type=aftermarket`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            Aftermarket
          </Link>
          <Link href={`/${locale}/catalog?category=brakes`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            Brakes
          </Link>
          <Link href={`/${locale}/catalog?category=engine`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            Engine
          </Link>
          <Link href={`/${locale}/catalog?category=suspension`} className="text-sm text-midnight-600 hover:text-gold-600 transition-colors font-medium">
            Suspension
          </Link>
          <Link href={`/${locale}/rfq`} className="ms-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-400 text-gold-700 text-xs font-bold hover:bg-gold-50 transition-colors">
            🔍 Request a Part
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {[
            { href: `/${locale}`, label: t('home') },
            { href: `/${locale}/catalog`, label: t('catalog') },
            { href: `/${locale}/rfq`, label: '🔍 Request a Part' },
            { href: `/${locale}/orders`, label: t('orders') },
            { href: `/${locale}/profile/garage`, label: '🚗 My Garage' },
            ...(user ? [] : [
              { href: `/${locale}/auth/login`, label: t('login') },
              { href: `/${locale}/auth/register`, label: t('register') },
            ]),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 px-3 rounded-lg text-sm text-midnight-700 hover:bg-gold-50 hover:text-gold-700 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
