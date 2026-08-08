import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sgo-souquea.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/en/', '/ar/'],
        disallow: [
          '/en/admin',
          '/ar/admin',
          '/en/vendor/dashboard',
          '/ar/vendor/dashboard',
          '/en/checkout',
          '/ar/checkout',
          '/api/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
