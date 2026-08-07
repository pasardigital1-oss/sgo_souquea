import { getTranslations } from 'next-intl/server'
import { getProducts, getCategories, getVehicleMakes } from '@/lib/supabase/queries'
import type { CatalogFilters } from '@/types'
import CatalogClient from './CatalogClient'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nav' })
  return { title: t('catalog') }
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams

  const filters: CatalogFilters = {
    q: sp.q,
    category: sp.category,
    make: sp.make,
    brand: sp.brand,
    part_type: sp.type as CatalogFilters['part_type'],
    sort: (sp.sort as CatalogFilters['sort']) || 'newest',
    page: sp.page ? parseInt(sp.page) : 1,
  }

  // Fetch in parallel
  const [{ data: products, count }, categories, makes] = await Promise.all([
    getProducts(filters),
    getCategories(true),
    getVehicleMakes(true),
  ])

  return (
    <CatalogClient
      locale={locale}
      initialProducts={products}
      totalCount={count}
      categories={categories}
      makes={makes}
      filters={filters}
    />
  )
}
