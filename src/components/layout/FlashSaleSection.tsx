'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Zap, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/shared/ProductCard'

export default function FlashSaleSection() {
  const locale = useLocale()
  const [sale, setSale] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [timeLeft, setTimeLeft] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      // Get active flash sale
      const { data: activeSale } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .lte('starts_at', new Date().toISOString())
        .limit(1)
        .single()

      if (!activeSale) { setLoading(false); return }
      setSale(activeSale)

      // Get flash sale items
      const { data: items } = await supabase
        .from('flash_sale_items')
        .select(`
          discount_percent,
          spare_parts(
            *,
            vendors(id, business_name, rating),
            part_categories(id, name, name_ar, slug),
            inventory(id, price_aed, quantity, emirate, vendor_id)
          )
        `)
        .eq('flash_sale_id', activeSale.id)
        .limit(4)

      if (items && items.length > 0) {
        setProducts(items.map((i: any) => ({ ...i.spare_parts, flashDiscount: i.discount_percent || activeSale.discount_percent })))
      } else {
        // If no specific items, show featured products with sale discount
        const { data: featured } = await supabase
          .from('spare_parts')
          .select('*, vendors(id, business_name, rating), part_categories(id, name, name_ar, slug), inventory(id, price_aed, quantity, emirate, vendor_id)')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(4)
        setProducts((featured ?? []).map((p: any) => ({ ...p, flashDiscount: activeSale.discount_percent })))
      }
      setLoading(false)
    }
    load()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!sale) return
    const update = () => {
      const end = new Date(sale.ends_at).getTime()
      const now = Date.now()
      const diff = end - now
      if (diff <= 0) { setTimeLeft('Ended'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [sale])

  if (loading || !sale || products.length === 0) return null

  return (
    <section className="py-10 bg-midnight-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">
                {sale.title} <span className="text-red-400">-{sale.discount_percent}%</span>
              </h2>
              <p className="text-midnight-400 text-xs">{sale.title_ar}</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span className="font-mono font-bold text-white text-lg">{timeLeft}</span>
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              flashDiscount={product.flashDiscount}
            />
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href={`/${locale}/catalog`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-red-500/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
            View All Sale Items →
          </Link>
        </div>
      </div>
    </section>
  )
}
