import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/layout/HeroSection'
import BrandsSection from '@/components/layout/BrandsSection'
import CategoriesSection from '@/components/layout/CategoriesSection'
import FeaturedProducts from '@/components/layout/FeaturedProducts'
import FlashSaleSection from '@/components/layout/FlashSaleSection'
import WhyChooseUs from '@/components/layout/WhyChooseUs'
import Footer from '@/components/layout/Footer'
import { getFeaturedProducts, getVehicleMakes, getCategories } from '@/lib/supabase/queries'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  return {
    title: 'SGO-SouqUAE | Premium Auto Parts UAE',
    description: t('heroSubtitle'),
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  // Fetch real data from Supabase in parallel
  const [featuredProducts, makes, categories] = await Promise.all([
    getFeaturedProducts(8),
    getVehicleMakes(true),
    getCategories(true),
  ])

  return (
    <main className="min-h-screen bg-warm-50">
      <Navbar />
      <HeroSection makes={makes as any} />
      <FlashSaleSection />
      <BrandsSection makes={makes as any} locale={locale} />
      <CategoriesSection categories={categories as any} locale={locale} />
      <FeaturedProducts products={featuredProducts as any} locale={locale} />
      <WhyChooseUs />
      <Footer />
    </main>
  )
}
