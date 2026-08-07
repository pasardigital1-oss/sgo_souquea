import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/layout/HeroSection'
import BrandsSection from '@/components/layout/BrandsSection'
import CategoriesSection from '@/components/layout/CategoriesSection'
import FeaturedProducts from '@/components/layout/FeaturedProducts'
import WhyChooseUs from '@/components/layout/WhyChooseUs'
import Footer from '@/components/layout/Footer'

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-warm-50">
      <Navbar />
      <HeroSection />
      <BrandsSection />
      <CategoriesSection />
      <FeaturedProducts />
      <WhyChooseUs />
      <Footer />
    </main>
  )
}
