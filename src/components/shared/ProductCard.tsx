'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Shield, Package, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { addVAT, formatAED } from '@/lib/utils'
import type { SparePart } from '@/types'
import { useCartStore } from '@/store/cartStore'

interface Props {
  product: SparePart
  locale: string
}

export default function ProductCard({ product, locale }: Props) {
  const tc = useTranslations('common')
  const tp = useTranslations('product')
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  // Get lowest price from inventory
  const prices = product.inventory?.map(i => i.price_aed) || []
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const totalStock = product.inventory?.reduce((sum, i) => sum + i.quantity, 0) || 0

  const { vatAmount, total } = addVAT(lowestPrice)

  const imageUrl = product.images?.[0] || null

  // Get best inventory entry (highest stock or lowest price)
  const bestInventory = product.inventory?.find(i => i.price_aed === lowestPrice) || product.inventory?.[0]

  const handleAddToCart = () => {
    if (!bestInventory || totalStock === 0) return
    addItem({
      inventory_id: bestInventory.id,
      part_id: product.id,
      name: product.name,
      name_ar: product.name_ar ?? undefined,
      part_number: product.part_number,
      brand: product.brand ?? undefined,
      image: imageUrl ?? undefined,
      price_aed: bestInventory.price_aed,
      quantity: 1,
      vendor_id: bestInventory.vendor_id,
      vendor_name: product.vendors?.business_name ?? '',
      max_stock: bestInventory.quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover luxury-shadow flex flex-col">
      {/* Image */}
      <Link href={`/${locale}/product/${product.id}`} className="relative h-48 bg-gradient-to-br from-gray-50 to-warm-200 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <Package className="w-16 h-16 text-gray-300 group-hover:scale-105 transition-transform" />
        )}

        {/* Part type badge */}
        <div className={`absolute top-3 start-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          product.part_type === 'oem'
            ? 'bg-gold-100 text-gold-800 border border-gold-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {product.part_type === 'oem' ? '✓ OEM' : tp(product.part_type as any)}
        </div>

        {/* Warranty */}
        {product.warranty_months > 0 && (
          <div className="absolute top-3 end-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-[10px] text-midnight-600 border border-gray-200">
            <Shield className="w-3 h-3 text-green-600" />
            {product.warranty_months}m
          </div>
        )}

        {/* Out of stock overlay */}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-red-500 bg-white px-3 py-1 rounded-full border border-red-200">
              {tc('outOfStock')}
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 space-y-2">
        {/* Brand */}
        {product.brand && (
          <p className="text-gold-600 text-xs font-semibold uppercase tracking-wider">{product.brand}</p>
        )}

        {/* Name */}
        <Link href={`/${locale}/product/${product.id}`}>
          <h3 className="font-semibold text-midnight-900 text-sm leading-snug group-hover:text-gold-700 transition-colors line-clamp-2">
            {locale === 'ar' && product.name_ar ? product.name_ar : product.name}
          </h3>
        </Link>

        {/* Part number */}
        <p className="text-midnight-400 text-xs font-mono bg-gray-50 px-2 py-0.5 rounded-md inline-block w-fit">
          {product.part_number}
        </p>

        {/* Vendor */}
        {product.vendors && (
          <p className="text-midnight-500 text-xs truncate">
            <span className="text-midnight-400">by </span>
            {product.vendors.business_name}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        {lowestPrice > 0 ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-bold text-lg text-midnight-900">
                {formatAED(total)}
              </span>
            </div>
            <p className="text-midnight-400 text-[10px]">{tc('vatIncluded')}</p>
          </div>
        ) : (
          <p className="text-midnight-400 text-sm italic">Price on request</p>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleAddToCart}
            disabled={totalStock === 0}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              added
                ? 'border-green-300 text-green-700 bg-green-50'
                : 'border-gold-300 text-gold-700 hover:bg-gold-50'
            }`}
          >
            {added ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                {tc('addToCart')}
              </>
            )}
          </button>
          <Link
            href={`/${locale}/product/${product.id}`}
            className="flex items-center justify-center py-2 rounded-xl gold-gradient text-midnight-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {tc('viewAll').replace('View All', 'Details')}
          </Link>
        </div>
      </div>
    </div>
  )
}
