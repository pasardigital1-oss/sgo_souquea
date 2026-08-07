'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ShoppingCart, Star, Shield } from 'lucide-react'
import { formatAED, addVAT } from '@/lib/utils'

// Sample data — akan diganti dari Supabase
const sampleProducts = [
  {
    id: 1,
    name: 'Oil Filter - Nissan Patrol V8',
    name_ar: 'فلتر زيت - نيسان باترول V8',
    part_number: '15208-31U0B',
    brand: 'Nissan OEM',
    part_type: 'oem',
    price_aed: 85.00,
    stock: 45,
    rating: 4.8,
    reviews: 23,
    vendor: 'Al Futtaim Auto Parts',
    warranty: 12,
    compatible: 'Nissan Patrol 2015-2023',
  },
  {
    id: 2,
    name: 'Front Brake Pads - Toyota Land Cruiser',
    name_ar: 'تيل فرامل أمامي - تويوتا لاند كروزر',
    part_number: '04465-60080',
    brand: 'Toyota OEM',
    part_type: 'oem',
    price_aed: 245.00,
    stock: 18,
    rating: 4.9,
    reviews: 41,
    vendor: 'Arabian Automobiles Parts',
    warranty: 6,
    compatible: 'Toyota Land Cruiser 200 2008-2021',
  },
  {
    id: 3,
    name: 'Air Filter - Mitsubishi Pajero',
    name_ar: 'فلتر هواء - ميتسوبيشي باجيرو',
    part_number: 'MR571476',
    brand: 'Bosch',
    part_type: 'aftermarket',
    price_aed: 65.00,
    stock: 32,
    rating: 4.6,
    reviews: 15,
    vendor: 'Gulf Auto Supplies',
    warranty: 12,
    compatible: 'Mitsubishi Pajero 2007-2023',
  },
  {
    id: 4,
    name: 'Spark Plug Set - Honda Accord',
    name_ar: 'بواجي - هوندا أكورد',
    part_number: '12290-R40-L01',
    brand: 'NGK',
    part_type: 'aftermarket',
    price_aed: 120.00,
    stock: 60,
    rating: 4.7,
    reviews: 32,
    vendor: 'Dubai Auto Zone',
    warranty: 24,
    compatible: 'Honda Accord 2013-2022',
  },
]

export default function FeaturedProducts() {
  const t = useTranslations('home')
  const tp = useTranslations('product')
  const tc = useTranslations('common')
  const locale = useLocale()

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
          {sampleProducts.map((product) => {
            const { vatAmount, total } = addVAT(product.price_aed)
            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover luxury-shadow"
              >
                {/* Product image placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-warm-200 flex items-center justify-center overflow-hidden">
                  <div className="text-6xl opacity-20">⚙️</div>
                  {/* Part type badge */}
                  <div className={`absolute top-3 start-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    product.part_type === 'oem'
                      ? 'bg-gold-100 text-gold-800 border border-gold-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {product.part_type === 'oem' ? '✓ OEM' : 'Aftermarket'}
                  </div>
                  {/* Warranty badge */}
                  <div className="absolute top-3 end-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] text-midnight-600 border border-gray-200">
                    <Shield className="w-3 h-3 text-green-600" />
                    {product.warranty}m
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Brand */}
                  <p className="text-gold-600 text-xs font-semibold uppercase tracking-wider">{product.brand}</p>

                  {/* Product name */}
                  <h3 className="font-semibold text-midnight-900 text-sm leading-snug group-hover:text-gold-700 transition-colors line-clamp-2">
                    {locale === 'ar' ? product.name_ar : product.name}
                  </h3>

                  {/* Part number */}
                  <p className="text-midnight-400 text-xs font-mono bg-gray-50 px-2 py-1 rounded-md inline-block">
                    {product.part_number}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-midnight-500 text-xs">({product.reviews})</span>
                  </div>

                  {/* Compatible */}
                  <p className="text-midnight-400 text-xs truncate">{product.compatible}</p>

                  {/* Price */}
                  <div className="pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading font-bold text-xl text-midnight-900">
                        {formatAED(total)}
                      </span>
                    </div>
                    <p className="text-midnight-400 text-[10px]">
                      {formatAED(product.price_aed)} + VAT {formatAED(vatAmount)}
                    </p>
                  </div>

                  {/* Vendor */}
                  <p className="text-midnight-500 text-xs truncate">
                    <span className="text-midnight-400">by </span>{product.vendor}
                  </p>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gold-300 text-gold-700 text-xs font-semibold hover:bg-gold-50 transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {tc('addToCart')}
                    </button>
                    <Link
                      href={`/${locale}/product/${product.id}`}
                      className="flex items-center justify-center py-2 rounded-xl gold-gradient text-midnight-900 text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      {tc('buyNow')}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
