'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Shield, Package, CheckCircle, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { addVAT, formatAED } from '@/lib/utils'
import type { SparePart } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'

interface Props {
  product: SparePart
  locale: string
  flashDiscount?: number
  priority?: boolean // for above-the-fold products
}

export default function ProductCard({ product, locale, flashDiscount, priority = false }: Props) {
  const tc = useTranslations('common')
  const tp = useTranslations('product')
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const prices = product.inventory?.map(i => i.price_aed) || []
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const totalStock = product.inventory?.reduce((sum, i) => sum + i.quantity, 0) || 0

  // Apply flash sale discount
  const effectivePrice = flashDiscount
    ? lowestPrice * (1 - flashDiscount / 100)
    : lowestPrice
  const { vatAmount, total } = addVAT(effectivePrice)

  const imageUrl = product.images?.[0] || null
  const bestInventory = product.inventory?.find(i => i.price_aed === lowestPrice) || product.inventory?.[0]

  // Check wishlist status
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('wishlists').select('id').eq('user_id', user.id).eq('part_id', product.id).single()
        .then(({ data }) => setWishlisted(!!data))
    })
  }, [product.id])

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlistLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setWishlistLoading(false); return }

    if (wishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('part_id', product.id)
      setWishlisted(false)
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, part_id: product.id })
      setWishlisted(true)
    }
    setWishlistLoading(false)
  }

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
      price_aed: effectivePrice,
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
          />
        ) : (
          <Package className="w-16 h-16 text-gray-300 group-hover:scale-105 transition-transform" />
        )}

        {/* Flash sale badge */}
        {flashDiscount && (
          <div className="absolute top-3 start-3 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
            -{flashDiscount}% SALE
          </div>
        )}

        {/* Part type badge — hide if flash sale */}
        {!flashDiscount && (
          <div className={`absolute top-3 start-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            product.part_type === 'oem'
              ? 'bg-gold-100 text-gold-800 border border-gold-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {product.part_type === 'oem' ? '✓ OEM' : tp(product.part_type as any)}
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-3 end-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
            wishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-midnight-400 hover:text-red-500 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Warranty */}
        {product.warranty_months > 0 && !flashDiscount && (
          <div className="absolute bottom-3 end-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-[10px] text-midnight-600 border border-gray-200">
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

        <div className="flex-1" />

        {/* Price */}
        {lowestPrice > 0 ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-bold text-lg text-midnight-900">
                {formatAED(total)}
              </span>
              {flashDiscount && (
                <span className="text-xs text-midnight-400 line-through">
                  {formatAED(addVAT(lowestPrice).total)}
                </span>
              )}
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
              <><CheckCircle className="w-3.5 h-3.5" />Added!</>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" />{tc('addToCart')}</>
            )}
          </button>
          <Link
            href={`/${locale}/product/${product.id}`}
            className="flex items-center justify-center py-2 rounded-xl gold-gradient text-midnight-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
