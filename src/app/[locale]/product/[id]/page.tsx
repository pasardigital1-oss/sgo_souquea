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

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sgo-souquea.vercel.app'
  const name = locale === 'ar' && product.name_ar ? product.name_ar : product.name
  const description = product.description
    || `${product.brand ?? ''} ${product.part_number} — ${product.part_type?.toUpperCase()} auto part available in UAE`
  const image = product.images?.[0] ?? `${APP_URL}/icons/icon-512x512.png`

  return {
    title: `${name} | SGO-SouqUAE`,
    description,
    openGraph: {
      title: name,
      description,
      images: [{ url: image, width: 800, height: 600, alt: name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${APP_URL}/${locale}/product/${id}`,
    },
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
