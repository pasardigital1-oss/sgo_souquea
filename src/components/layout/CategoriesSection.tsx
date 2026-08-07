'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Settings, Disc, Zap, Wind, Droplets, Shield, Gauge, Wrench } from 'lucide-react'

const categories = [
  { slug: 'engine', icon: Settings, label: 'Engine Parts', labelAr: 'قطع المحرك', count: 8420, color: 'text-orange-600 bg-orange-50' },
  { slug: 'brakes', icon: Disc, label: 'Brakes', labelAr: 'الفرامل', count: 4210, color: 'text-red-600 bg-red-50' },
  { slug: 'electrical', icon: Zap, label: 'Electrical', labelAr: 'الكهرباء', count: 5600, color: 'text-yellow-600 bg-yellow-50' },
  { slug: 'ac-cooling', icon: Wind, label: 'A/C & Cooling', labelAr: 'التكييف والتبريد', count: 2890, color: 'text-blue-600 bg-blue-50' },
  { slug: 'filters-fluids', icon: Droplets, label: 'Filters & Fluids', labelAr: 'الفلاتر والسوائل', count: 3120, color: 'text-cyan-600 bg-cyan-50' },
  { slug: 'body-exterior', icon: Shield, label: 'Body & Exterior', labelAr: 'الهيكل والمظهر', count: 6780, color: 'text-green-600 bg-green-50' },
  { slug: 'suspension', icon: Gauge, label: 'Suspension', labelAr: 'التعليق', count: 3450, color: 'text-purple-600 bg-purple-50' },
  { slug: 'tools', icon: Wrench, label: 'Tools & Accessories', labelAr: 'الأدوات والإكسسوارات', count: 1890, color: 'text-gray-600 bg-gray-50' },
]

export default function CategoriesSection() {
  const t = useTranslations('home')
  const locale = useLocale()

  return (
    <section className="py-14 bg-warm-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-gold-600 text-sm font-medium tracking-wider uppercase mb-2">Browse by</p>
          <h2 className="font-heading text-3xl font-bold text-midnight-900">{t('shopByCategory')}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/${locale}/catalog?category=${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gold-300 hover:shadow-lg card-hover transition-all text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-midnight-800 text-xs leading-tight group-hover:text-gold-700 transition-colors">
                    {locale === 'ar' ? cat.labelAr : cat.label}
                  </p>
                  <p className="text-midnight-400 text-[10px] mt-0.5">{cat.count.toLocaleString()} parts</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
