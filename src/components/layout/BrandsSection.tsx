'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'

const brands = [
  { name: 'Toyota', count: '12,400+', color: 'bg-red-50' },
  { name: 'Nissan', count: '9,800+', color: 'bg-blue-50' },
  { name: 'Mitsubishi', count: '7,200+', color: 'bg-red-50' },
  { name: 'Honda', count: '8,500+', color: 'bg-gray-50' },
  { name: 'Kia', count: '6,300+', color: 'bg-red-50' },
  { name: 'Hyundai', count: '7,100+', color: 'bg-blue-50' },
  { name: 'Ford', count: '5,200+', color: 'bg-blue-50' },
  { name: 'BMW', count: '4,800+', color: 'bg-blue-50' },
  { name: 'Mercedes', count: '5,600+', color: 'bg-gray-50' },
  { name: 'Lexus', count: '3,900+', color: 'bg-gray-50' },
]

export default function BrandsSection() {
  const t = useTranslations('home')
  const locale = useLocale()

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
            {useTranslations('common')('viewAll')}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/${locale}/catalog?brand=${brand.name.toLowerCase()}`}
              className={`group flex flex-col items-center gap-2 p-4 rounded-xl ${brand.color} border border-gray-100 hover:border-gold-300 hover:shadow-md card-hover transition-all`}
            >
              {/* Brand initial as placeholder */}
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-midnight-900 font-heading font-bold text-lg border border-gray-100">
                {brand.name[0]}
              </div>
              <div className="text-center">
                <p className="font-semibold text-midnight-800 text-sm group-hover:text-gold-700 transition-colors">
                  {brand.name}
                </p>
                <p className="text-midnight-400 text-xs">{brand.count} parts</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
