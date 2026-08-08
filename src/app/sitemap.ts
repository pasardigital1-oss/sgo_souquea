import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sgo-souquea.vercel.app'
const LOCALES = ['en', 'ar']

const STATIC_ROUTES = [
  '',           // homepage
  '/catalog',
  '/cart',
  '/orders',
  '/profile',
  '/vin',
  '/help',
  '/privacy',
  '/terms',
  '/returns',
  '/used-parts',
  '/rfq',
  '/auth/login',
  '/auth/register',
  '/vendor/onboarding',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${APP_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : route === '/catalog' ? 'hourly' : 'weekly',
        priority: route === '' ? 1.0 : route === '/catalog' ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map(l => [l, `${APP_URL}/${l}${route}`])
          ),
        },
      })
    }
  }

  return entries
}
