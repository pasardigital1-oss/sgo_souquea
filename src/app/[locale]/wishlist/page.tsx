'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shared/ProductCard'
import { createClient } from '@/lib/supabase/client'
import { Heart, Loader2 } from 'lucide-react'

export default function WishlistPage() {
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/${locale}/auth/login`); return }

      // Step 1: Get wishlist part IDs
      const { data: wishlistData } = await supabase
        .from('wishlists')
        .select('part_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!wishlistData || wishlistData.length === 0) {
        setLoading(false)
        return
      }

      const partIds = wishlistData.map((w: any) => w.part_id)

      // Step 2: Fetch the actual products
      const { data: partsData } = await supabase
        .from('spare_parts')
        .select(`
          *,
          vendors(id, business_name, rating),
          part_categories(id, name, name_ar, slug),
          inventory(id, price_aed, quantity, emirate, vendor_id)
        `)
        .in('id', partIds)

      setProducts(partsData ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router])

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
          <Heart className="w-6 h-6 text-gold-400 fill-current" />
          <h1 className="font-heading text-2xl font-bold text-white">My Wishlist</h1>
          {products.length > 0 && (
            <span className="text-midnight-400 text-sm">{products.length} items</span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-midnight-700 mb-2">No saved parts yet</h3>
            <p className="text-midnight-400 text-sm mb-6">Click the ❤️ on any product to save it here</p>
            <Link href={`/${locale}/catalog`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
              Browse Parts →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
