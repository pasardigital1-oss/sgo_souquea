import { notFound } from 'next/navigation'
import { getProductById, getFeaturedProducts } from '@/lib/supabase/queries'
import { getTranslations } from 'next-intl/server'
import ProductDetailClient from './ProductDetailClient'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id, locale } = await params
  const product = await getProductById(id)
  if (!product) return { title: 'Product Not Found' }
  const t = await getTranslations({ locale, namespace: 'product' })
  return {
    title: locale === 'ar' && product.name_ar ? product.name_ar : product.name,
    description: product.description || `${product.brand} ${product.part_number}`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params
  const [product, related] = await Promise.all([
    getProductById(id),
    getFeaturedProducts(4),
  ])

  if (!product) notFound()

  return <ProductDetailClient product={product as any} related={related as any} locale={locale} />
}
