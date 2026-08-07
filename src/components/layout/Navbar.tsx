'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const localeNames = {
  en: 'EN',
  ar: 'عر',
  id: 'ID',
}

const localeFullNames = {
  en: 'English',
  ar: 'العربية',
  id: 'Indonesia',
}

export default function Navbar() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const switchLocale = (newLocale: string) => {
    // Replace locale segment in URL
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setLangOpen(false)
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
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
              <input
                type="text"
                placeholder={tc('searchPlaceholder')}
                className="w-full ps-10 pe-4 py-2.5 rounded-full border border-gray-200 bg-warm-100 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all placeholder:text-midnight-400"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/${locale}/auth/login`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-midnight-700 hover:bg-gold-50 hover:text-gold-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{t('login')}</span>
            </Link>

            <Link
              href={`/${locale}/cart`}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gold-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-midnight-700" />
              <span className="absolute top-1 end-1 w-4 h-4 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
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
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {[
            { href: `/${locale}`, label: t('home') },
            { href: `/${locale}/catalog`, label: t('catalog') },
            { href: `/${locale}/orders`, label: t('orders') },
            { href: `/${locale}/auth/login`, label: t('login') },
            { href: `/${locale}/auth/register`, label: t('register') },
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
