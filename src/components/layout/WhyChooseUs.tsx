'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle, Truck, FileText, ShieldCheck } from 'lucide-react'

const benefits = [
  {
    icon: CheckCircle,
    titleKey: 'benefit1Title',
    descKey: 'benefit1Desc',
    color: 'text-gold-600 bg-gold-50',
  },
  {
    icon: Truck,
    titleKey: 'benefit2Title',
    descKey: 'benefit2Desc',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: FileText,
    titleKey: 'benefit3Title',
    descKey: 'benefit3Desc',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: ShieldCheck,
    titleKey: 'benefit4Title',
    descKey: 'benefit4Desc',
    color: 'text-purple-600 bg-purple-50',
  },
]

export default function WhyChooseUs() {
  const t = useTranslations('home')

  return (
    <section className="py-16 bg-midnight-900 relative overflow-hidden">
      {/* Gold accent */}
      <div className="absolute top-0 left-0 right-0 h-px gold-gradient opacity-40" />
      <div className="absolute bottom-0 left-0 right-0 h-px gold-gradient opacity-40" />

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full border border-gold-500/10" />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full border border-gold-500/10" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-gold-500 text-sm font-medium tracking-wider uppercase mb-2">Trusted Platform</p>
          <h2 className="font-heading text-3xl font-bold text-white">{t('whyChooseUs')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-gold-500/30 hover:bg-white/8 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${b.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-semibold text-white mb-2">{t(b.titleKey as any)}</h3>
                <p className="text-midnight-400 text-sm leading-relaxed">{t(b.descKey as any)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
