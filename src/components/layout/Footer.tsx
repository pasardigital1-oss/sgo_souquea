'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-midnight-900 text-midnight-300 border-t border-white/5">
      {/* Gold line */}
      <div className="h-1 gold-gradient" />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <span className="font-heading font-bold text-white text-lg">
                  SGO<span className="gold-text">Souq</span>UAE
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-midnight-400">
              UAE&apos;s premium marketplace for genuine and aftermarket auto parts. Serving all 7 Emirates.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                <span>Dubai, United Arab Emirates</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                <span>+971 XX XXX XXXX</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                <span>support@sgosouquae.com</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-2">
              {[
                { href: `/${locale}/catalog`, label: t('catalog') },
                { href: `/${locale}/catalog?type=oem`, label: 'OEM Parts' },
                { href: `/${locale}/catalog?type=aftermarket`, label: 'Aftermarket' },
                { href: `/${locale}/catalog?new=true`, label: 'New Arrivals' },
                { href: `/${locale}/vendors`, label: 'Our Vendors' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {[
                { href: `/${locale}/auth/login`, label: t('login') },
                { href: `/${locale}/auth/register`, label: t('register') },
                { href: `/${locale}/orders`, label: t('orders') },
                { href: `/${locale}/profile`, label: t('profile') },
                { href: `/${locale}/auth/register?role=vendor`, label: 'Become a Vendor' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              {[
                { href: '#', label: 'Help Center' },
                { href: '#', label: 'Track Order' },
                { href: '#', label: 'Return Policy' },
                { href: '#', label: 'Privacy Policy' },
                { href: '#', label: 'Terms of Service' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-midnight-500">
            © {year} SGO-SouqUAE. All rights reserved. Powered by <span className="text-gold-600">Pasar Digital</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-midnight-500">VAT compliant • Trade License verified</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
