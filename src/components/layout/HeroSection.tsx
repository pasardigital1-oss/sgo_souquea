'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Search, Car, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { VehicleMake } from '@/types'

interface Props {
  makes: VehicleMake[]
}

export default function HeroSection({ makes }: Props) {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <section className="relative overflow-hidden bg-midnight-900 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(201,168,76,0.5) 20px,
            rgba(201,168,76,0.5) 21px
          )`
        }} />
      </div>

      {/* Gold accent line top */}
      <div className="h-1 gold-gradient" />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-600/40 bg-gold-900/20 text-gold-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              UAE&apos;s #1 Auto Parts Platform
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              {locale === 'ar' ? (
                <span className="font-arabic">{t('heroTitle')}</span>
              ) : (
                <>
                  Your Premium{' '}
                  <span className="gold-text">Auto Parts</span>{' '}
                  Marketplace in UAE
                </>
              )}
            </h1>

            <p className="text-midnight-300 text-lg leading-relaxed max-w-lg">
              {t('heroSubtitle')}
            </p>

            {/* Search box */}
            <div className="relative max-w-lg">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                <Search className="ms-2 w-5 h-5 text-gold-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('heroSearch')}
                  className="flex-1 bg-transparent text-white placeholder:text-midnight-400 text-sm focus:outline-none px-2 py-1"
                />
                <Link
                  href={`/${locale}/catalog?q=${searchQuery}`}
                  className="px-4 py-2 rounded-xl gold-gradient text-midnight-900 font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
                >
                  {tc('search')}
                </Link>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { value: '50K+', label: 'Parts Available' },
                { value: '500+', label: 'Verified Vendors' },
                { value: '7', label: 'Emirates Covered' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-heading font-bold gold-text">{stat.value}</div>
                  <div className="text-midnight-400 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Shop by vehicle */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <Car className="w-5 h-5 text-gold-400" />
              <h2 className="font-heading text-lg font-semibold text-white">{t('shopByVehicle')}</h2>
            </div>

            {/* Vehicle make grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {makes.slice(0, 6).map((make) => (
                <Link
                  key={make.id}
                  href={`/${locale}/catalog?make=${make.name.toLowerCase()}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 hover:border-gold-500/50 hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                    {make.name[0]}
                  </div>
                  <span className="text-xs text-midnight-300 group-hover:text-gold-400 transition-colors font-medium">
                    {make.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Or search by model */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-midnight-400 text-xs mb-3 text-center">Or select manually</p>
              <div className="grid grid-cols-3 gap-2">
                <select className="col-span-1 px-2 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-gold-400">
                  <option value="">Make</option>
                  {makes.map(m => (
                    <option key={m.id} value={m.name.toLowerCase()} className="text-black">{m.name}</option>
                  ))}
                </select>
                <select className="col-span-1 px-2 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-gold-400">
                  <option value="">Model</option>
                </select>
                <select className="col-span-1 px-2 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-gold-400">
                  <option value="">Year</option>
                  {Array.from({ length: 25 }, (_, i) => 2025 - i).map(y => (
                    <option key={y} value={y} className="text-black">{y}</option>
                  ))}
                </select>
              </div>
              <button className="mt-3 w-full py-2.5 rounded-xl border border-gold-500/50 text-gold-400 text-sm font-medium hover:bg-gold-500/10 transition-colors flex items-center justify-center gap-2">
                Find Parts for My Vehicle
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gold accent line bottom */}
      <div className="h-px gold-gradient opacity-30" />
    </section>
  )
}
