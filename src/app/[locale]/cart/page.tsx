'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatAED } from '@/lib/utils'

export default function CartPage() {
  const tc = useTranslations('cart')
  const locale = useLocale()
  const { items, removeItem, updateQuantity, subtotal, vatAmount, grandTotal } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-5" />
          <h2 className="font-heading text-2xl font-bold text-midnight-800 mb-2">{tc('empty')}</h2>
          <p className="text-midnight-400 text-sm mb-8">{tc('emptyDesc')}</p>
          <Link
            href={`/${locale}/catalog`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-gradient text-midnight-900 font-bold hover:opacity-90 transition-opacity"
          >
            {tc('continueShopping')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-midnight-900 mb-6">
          {tc('title')} <span className="text-midnight-400 font-normal text-lg">({items.length} {tc('items')})</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.inventory_id} className="bg-white rounded-2xl border border-gray-100 p-4 luxury-shadow">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={80} height={80} className="object-contain" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gold-600 font-semibold uppercase tracking-wider mb-0.5">{item.brand}</p>
                    <h3 className="font-semibold text-midnight-900 text-sm leading-snug line-clamp-2">
                      {locale === 'ar' && item.name_ar ? item.name_ar : item.name}
                    </h3>
                    <p className="text-xs font-mono text-midnight-400 mt-0.5">{item.part_number}</p>
                    <p className="text-xs text-midnight-400 mt-0.5">by {item.vendor_name}</p>
                  </div>

                  {/* Price */}
                  <div className="text-end shrink-0">
                    <p className="font-heading font-bold text-midnight-900">
                      {formatAED(item.price_aed * item.quantity)}
                    </p>
                    <p className="text-xs text-midnight-400">{formatAED(item.price_aed)} each</p>
                  </div>
                </div>

                {/* Qty + remove */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-midnight-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-midnight-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.inventory_id)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {tc('remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 luxury-shadow sticky top-20">
              <h2 className="font-heading font-semibold text-midnight-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">{tc('subtotal')}</span>
                  <span className="font-medium text-midnight-900">{formatAED(subtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">{tc('vat')}</span>
                  <span className="font-medium text-midnight-900">{formatAED(vatAmount())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">{tc('shipping')}</span>
                  <span className="text-green-600 font-medium">{tc('freeShipping')}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between">
                  <span className="font-heading font-bold text-midnight-900">{tc('total')}</span>
                  <span className="font-heading font-bold text-xl text-midnight-900">{formatAED(grandTotal())}</span>
                </div>
                <p className="text-xs text-midnight-400 mt-0.5 text-end">Incl. 5% VAT</p>
              </div>

              <Link
                href={`/${locale}/checkout`}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gold-gradient text-midnight-900 font-bold hover:opacity-90 transition-opacity"
              >
                {tc('checkout')}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/${locale}/catalog`}
                className="w-full flex items-center justify-center mt-3 text-sm text-midnight-500 hover:text-gold-600 transition-colors"
              >
                {tc('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
