'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Shield, Star, ChevronRight, Package, Truck, CheckCircle, Minus, Plus } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shared/ProductCard'
import ReviewForm from './ReviewForm'
import { addVAT, formatAED } from '@/lib/utils'
import type { SparePart } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'

interface Props {
  product: SparePart & { part_compatibility?: any[]; vendors?: any }
  related: SparePart[]
  locale: string
}

export default function ProductDetailClient({ product, related, locale }: Props) {
  const tc = useTranslations('common')
  const tp = useTranslations('product')
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'compatibility' | 'reviews'>('description')
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const prices = product.inventory?.map((i: any) => i.price_aed) || []
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const totalStock = product.inventory?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0
  const { vatAmount, total } = addVAT(lowestPrice)
  const bestInventory = product.inventory?.find((i: any) => i.price_aed === lowestPrice) || product.inventory?.[0]

  const images = product.images?.length > 0 ? product.images : []
  const displayName = locale === 'ar' && product.name_ar ? product.name_ar : product.name

  const handleAddToCart = () => {
    if (!bestInventory || totalStock === 0) return
    addItem({
      inventory_id: bestInventory.id,
      part_id: product.id,
      name: product.name,
      name_ar: product.name_ar ?? undefined,
      part_number: product.part_number,
      brand: product.brand ?? undefined,
      image: images[0] ?? undefined,
      price_aed: lowestPrice,
      quantity,
      vendor_id: bestInventory.vendor_id,
      vendor_name: product.vendors?.business_name ?? '',
      max_stock: bestInventory.quantity,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push(`/${locale}/cart`)
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-midnight-400">
          <Link href={`/${locale}`} className="hover:text-gold-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/${locale}/catalog`} className="hover:text-gold-600">Catalog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-midnight-700 truncate max-w-[200px]">{displayName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden h-96 flex items-center justify-center luxury-shadow">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]}
                  alt={displayName}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <Package className="w-24 h-24 text-gray-200" />
              )}

              {/* Part type badge */}
              <div className={`absolute top-4 start-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                product.part_type === 'oem'
                  ? 'bg-gold-100 text-gold-800 border border-gold-300'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {product.part_type === 'oem' ? '✓ OEM Genuine' : tp(product.part_type as any)}
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      activeImage === i ? 'border-gold-400' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image src={img} alt="" width={64} height={64} className="object-contain w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            {/* Brand + Category */}
            <div className="flex items-center gap-3">
              {product.brand && (
                <span className="text-gold-600 font-semibold text-sm uppercase tracking-wider">{product.brand}</span>
              )}
              {product.part_categories && (
                <span className="text-midnight-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {product.part_categories.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-midnight-900 leading-tight">
              {displayName}
            </h1>

            {/* Part numbers */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-midnight-400 text-xs">{tp('partNumber')}:</span>
                <span className="font-mono text-xs font-semibold text-midnight-800">{product.part_number}</span>
              </div>
              {product.oem_code && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-50 rounded-lg border border-gold-200">
                  <span className="text-gold-600 text-xs">OEM:</span>
                  <span className="font-mono text-xs font-semibold text-gold-800">{product.oem_code}</span>
                </div>
              )}
            </div>

            {/* Warranty */}
            {product.warranty_months > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Shield className="w-4 h-4" />
                <span>{product.warranty_months} {tc('month')} {tc('warranty')}</span>
              </div>
            )}

            {/* Vendor */}
            {product.vendors && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold text-sm">
                  {product.vendors.business_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-midnight-800">{product.vendors.business_name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                    <span className="text-xs text-midnight-500">{product.vendors.rating?.toFixed(1) || '—'}</span>
                    <span className="text-xs text-midnight-400">• {product.vendors.emirate?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              {totalStock > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">{tc('inStock')} ({totalStock} {tc('pieces')})</span>
                </>
              ) : (
                <span className="text-red-500 text-sm font-medium">{tc('outOfStock')}</span>
              )}
            </div>

            {/* Price */}
            {lowestPrice > 0 && (
              <div className="p-4 bg-white rounded-xl border border-gray-200 luxury-shadow">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-heading font-bold text-3xl text-midnight-900">{formatAED(total)}</span>
                </div>
                <div className="text-xs text-midnight-400 space-y-0.5">
                  <p>{tp('partNumber').replace('Part Number', 'Base price')}: {formatAED(lowestPrice)}</p>
                  <p>VAT (5%): {formatAED(vatAmount)}</p>
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            {totalStock > 0 && (
              <div className="flex items-center gap-3">
                {/* Qty */}
                <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-midnight-600" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-midnight-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(totalStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-midnight-600" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={totalStock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    addedToCart
                      ? 'border-green-400 text-green-700 bg-green-50'
                      : 'border-gold-400 text-gold-700 hover:bg-gold-50'
                  }`}
                >
                  {addedToCart
                    ? <><CheckCircle className="w-4 h-4" /> Added to Cart!</>
                    : <><ShoppingCart className="w-4 h-4" /> {tc('addToCart')}</>
                  }
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={totalStock === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {tc('buyNow')}
                </button>
              </div>
            )}

            {/* Delivery info */}
            <div className="flex items-center gap-2 text-sm text-midnight-500 border-t border-gray-100 pt-4">
              <Truck className="w-4 h-4 text-gold-500" />
              <span>Fast delivery across all Emirates</span>
            </div>

            {/* Contact Vendor — WhatsApp + Botim */}
            {product.vendors && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://wa.me/${(product.vendors.phone || '').replace(/[^\d+]/g, '')}?text=${encodeURIComponent(`Hello ${product.vendors.business_name}, I'm interested in: ${product.name} (Part #${product.part_number}). Price: AED ${total.toFixed(2)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#25D366] text-[#25D366] font-semibold text-sm hover:bg-green-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a
                  href={`botim://send?phone=${(product.vendors.phone || '').replace(/[^\d+]/g, '')}`}
                  onClick={(e) => {
                    // Fallback to Botim website if app not installed
                    setTimeout(() => { window.open('https://botim.me/', '_blank') }, 1500)
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-[#0066CC] text-[#0066CC] font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  Botim
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow mb-10">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {(['description', 'specs', 'compatibility', 'reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-gold-500 text-gold-700'
                    : 'border-transparent text-midnight-500 hover:text-midnight-700'
                }`}
              >
                {tp(tab as any)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-midnight-700">
                {locale === 'ar' && product.description_ar
                  ? <p>{product.description_ar}</p>
                  : product.description
                    ? <p>{product.description}</p>
                    : <p className="text-midnight-400 italic">No description available.</p>
                }
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: tp('partNumber'), value: product.part_number },
                  { label: tp('oemCode'), value: product.oem_code || '—' },
                  { label: tp('brand'), value: product.brand || '—' },
                  { label: tp('partType'), value: tp(product.part_type as any) },
                  { label: tp('condition'), value: tp(product.condition as any) },
                  { label: tc('warranty'), value: `${product.warranty_months} ${tc('month')}` },
                  { label: 'Weight', value: product.weight_kg ? `${product.weight_kg} kg` : '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-midnight-500">{row.label}</span>
                    <span className="text-sm font-medium text-midnight-900">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'compatibility' && (
              <div>
                {product.part_compatibility && product.part_compatibility.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {product.part_compatibility.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <p className="font-semibold text-sm text-midnight-800">
                          {c.vehicle_makes?.name} {c.vehicle_models?.model_name}
                        </p>
                        {(c.year_from || c.year_to) && (
                          <p className="text-xs text-midnight-500 mt-0.5">
                            {c.year_from || ''}–{c.year_to || 'present'}
                          </p>
                        )}
                        {c.notes && <p className="text-xs text-midnight-400 mt-1">{c.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-midnight-400 text-sm italic">Compatibility data not available for this part.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewForm partId={product.id} vendorId={product.vendor_id} />
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-midnight-900 mb-6">{tp('relatedProducts')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} locale={locale} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
