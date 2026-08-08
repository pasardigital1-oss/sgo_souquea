import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter, Noto_Naskh_Arabic } from 'next/font/google'
import './globals.css'

// Self-hosted fonts — tidak bergantung Google CDN saat runtime
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

const notoArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false, // load on demand
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'SGO-SouqUAE | Premium Auto Parts Marketplace',
    template: '%s | SGO-SouqUAE'
  },
  description: 'Find genuine OEM & aftermarket auto parts for all vehicles in UAE. Fast delivery across all Emirates.',
  keywords: ['auto parts', 'spare parts', 'UAE', 'Dubai', 'OEM', 'aftermarket', 'قطع غيار', 'سيارات'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SGO-SouqUAE',
    startupImage: '/icons/icon-512x512.png',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'SGO-SouqUAE',
  }
}

export const viewport: Viewport = {
  themeColor: '#c9a84c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} ${notoArabic.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}
