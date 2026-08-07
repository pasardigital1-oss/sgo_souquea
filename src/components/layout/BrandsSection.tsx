'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import type { VehicleMake } from '@/types'

interface Props {
  makes: VehicleMake[]
  locale: string
}

// Fallback colors per brand origin
const ORIGIN_COLORS: Record<string, string> = {
  Japan: 'bg-red-50',
  Korea: 'bg-blue-50',
  USA: 'bg-blue-50',
  Germany: 'bg-gray-50',
  UK: 'bg-green-50',
}

export default function BrandsSection({ makes, locale }: Props) {
  const t = useTranslations('home')
  const tc = useTranslations('common')

  if (makes.length === 0) return null

  return (
    <section className="py-14 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-gold-600 text-sm font-medium tracking-wider uppercase mb-1">Shop by Brand</p>
            <h2 className="font-heading text-3xl font-bold text-midnight-900">{t('popularBrands')}</h2>
          </div>
          <Link
            href={`/${locale}/catalog`}
            className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1 group"
          >
            {tc('viewAll')}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {makes.slice(0, 10).map((make) => {
            const bgColor = ORIGIN_COLORS[make.origin || ''] || 'bg-gray-50'
            return (
              <Link
                key={make.id}
                href={`/${locale}/catalog?make=${make.name.toLowerCase()}`}
                className={`group flex flex-col items-center gap-2 p-4 rounded-xl ${bgColor} border border-gray-100 hover:border-gold-300 hover:shadow-md card-hover transition-all`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-midnight-900 border border-gray-100 overflow-hidden">
                  {make.logo_url ? (
                    <Image src={make.logo_url} alt={make.name} width={40} height={40} className="object-contain" />
                  ) : (
                    <span className="font-heading font-bold text-lg">{make.name[0]}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-midnight-800 text-sm group-hover:text-gold-700 transition-colors">
                    {make.name}
                  </p>
                  <p className="text-midnight-400 text-xs">{make.origin}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
