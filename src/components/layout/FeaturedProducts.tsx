'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import ProductCard from '@/components/shared/ProductCard'
import type { SparePart } from '@/types'

interface Props {
  products: SparePart[]
  locale: string
}

export default function FeaturedProducts({ products, locale }: Props) {
  const t = useTranslations('home')
  const tc = useTranslations('common')

  if (products.length === 0) return null

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-gold-600 text-sm font-medium tracking-wider uppercase mb-1">Hand-picked</p>
            <h2 className="font-heading text-3xl font-bold text-midnight-900">{t('featuredProducts')}</h2>
          </div>
          <Link
            href={`/${locale}/catalog`}
            className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1 group"
          >
            {tc('viewAll')}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(product => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
