'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Settings, Disc, Zap, Wind, Droplets, Shield, Gauge, Wrench } from 'lucide-react'
import type { PartCategory } from '@/types'

interface Props {
  categories: PartCategory[]
  locale: string
}

const CATEGORY_ICONS: Record<string, { icon: typeof Settings; color: string }> = {
  'engine':         { icon: Settings, color: 'text-orange-600 bg-orange-50' },
  'brakes':         { icon: Disc, color: 'text-red-600 bg-red-50' },
  'electrical':     { icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
  'ac-cooling':     { icon: Wind, color: 'text-blue-600 bg-blue-50' },
  'filters-fluids': { icon: Droplets, color: 'text-cyan-600 bg-cyan-50' },
  'body-exterior':  { icon: Shield, color: 'text-green-600 bg-green-50' },
  'suspension':     { icon: Gauge, color: 'text-purple-600 bg-purple-50' },
  'tools':          { icon: Wrench, color: 'text-gray-600 bg-gray-50' },
}

export default function CategoriesSection({ categories, locale }: Props) {
  const t = useTranslations('home')

  if (categories.length === 0) return null

  return (
    <section className="py-14 bg-warm-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-gold-600 text-sm font-medium tracking-wider uppercase mb-2">Browse by</p>
          <h2 className="font-heading text-3xl font-bold text-midnight-900">{t('shopByCategory')}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const config = CATEGORY_ICONS[cat.slug] || { icon: Wrench, color: 'text-gray-600 bg-gray-50' }
            const Icon = config.icon
            const label = locale === 'ar' && cat.name_ar ? cat.name_ar : cat.name

            return (
              <Link
                key={cat.id}
                href={`/${locale}/catalog?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gold-300 hover:shadow-lg card-hover transition-all text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-midnight-800 text-xs leading-tight group-hover:text-gold-700 transition-colors">
                  {label}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
