import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sgo-souquea.vercel.app'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: isAr ? 'SGO-SouqUAE | سوق قطع غيار السيارات في الإمارات' : 'SGO-SouqUAE | Premium Auto Parts UAE',
      template: '%s | SGO-SouqUAE',
    },
    description: isAr
      ? 'اشتري وبع قطع غيار السيارات الأصلية والبديلة في الإمارات العربية المتحدة. أفضل الأسعار من الموردين المعتمدين في دبي وأبوظبي والشارقة.'
      : 'Buy and sell OEM & aftermarket auto parts in the UAE. Best prices from trusted vendors in Dubai, Abu Dhabi & Sharjah.',
    keywords: [
      'auto parts UAE', 'spare parts Dubai', 'car parts Abu Dhabi',
      'OEM parts UAE', 'aftermarket parts', 'قطع غيار سيارات',
      'SGO-SouqUAE', 'auto parts marketplace', 'vehicle parts UAE',
    ],
    authors: [{ name: 'SGO-SouqUAE' }],
    creator: 'SGO-SouqUAE',
    publisher: 'SGO-SouqUAE',
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      type: 'website',
      locale: isAr ? 'ar_AE' : 'en_AE',
      alternateLocale: isAr ? 'en_AE' : 'ar_AE',
      url: `${APP_URL}/${locale}`,
      siteName: 'SGO-SouqUAE',
      title: isAr ? 'SGO-SouqUAE | سوق قطع غيار السيارات في الإمارات' : 'SGO-SouqUAE | Premium Auto Parts UAE',
      description: isAr
        ? 'سوق قطع غيار السيارات الرائد في الإمارات العربية المتحدة'
        : "UAE's leading auto parts marketplace — OEM & aftermarket parts from trusted vendors",
      images: [
        {
          url: `${APP_URL}/icons/icon-512x512.png`,
          width: 512,
          height: 512,
          alt: 'SGO-SouqUAE Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SGO-SouqUAE | Premium Auto Parts UAE',
      description: "UAE's leading auto parts marketplace",
      images: [`${APP_URL}/icons/icon-512x512.png`],
    },
    alternates: {
      canonical: `${APP_URL}/${locale}`,
      languages: {
        'en': `${APP_URL}/en`,
        'ar': `${APP_URL}/ar`,
      },
    },
    verification: {
      // google: 'your-google-site-verification', // add when available
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'mask-icon', url: '/icons/icon-512x512.png' },
      ],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'ar' | 'id')) {
    notFound()
  }

  const messages = await getMessages()
  const isRTL = locale === 'ar'

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://kelfndholimoyeyqmckw.supabase.co" />
        <link rel="dns-prefetch" href="https://kelfndholimoyeyqmckw.supabase.co" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
