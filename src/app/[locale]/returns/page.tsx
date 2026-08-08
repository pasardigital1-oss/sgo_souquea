import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'

type Props = { params: Promise<{ locale: string }> }

export default async function ReturnPolicyPage({ params }: Props) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gold-gradient mb-4">
            <RotateCcw className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Return Policy</h1>
          <p className="text-midnight-400 text-sm">Last updated: August 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, color: 'text-blue-500 bg-blue-50', title: '7 Days', desc: 'Return window after delivery' },
            { icon: CheckCircle, color: 'text-green-500 bg-green-50', title: 'Full Refund', desc: 'For wrong or defective items' },
            { icon: XCircle, color: 'text-red-500 bg-red-50', title: 'No Return', desc: 'For used or installed parts' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.title} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-5 text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-heading font-bold text-midnight-900 text-lg">{card.title}</p>
                <p className="text-xs text-midnight-400 mt-1">{card.desc}</p>
              </div>
            )
          })}
        </div>

        {[
          {
            title: '1. Eligibility for Returns',
            content: [
              'Items must be returned within 7 days of delivery date',
              'Parts must be unused, uninstalled, and in original packaging',
              'Original invoice or proof of purchase is required',
              'Items damaged due to improper installation are not eligible',
            ]
          },
          {
            title: '2. Non-Returnable Items',
            content: [
              'Electrical components that have been connected or tested',
              'Parts that have been installed on a vehicle',
              'Items damaged by the customer after delivery',
              'Special order items (custom or non-stock parts)',
              'Clearance or final sale items',
            ]
          },
          {
            title: '3. Return Process',
            content: [
              'Go to My Orders and find the order you want to return',
              'Contact the vendor directly through the order page',
              'Vendor will provide return instructions and shipping label',
              'Pack the item securely in original packaging',
              'Drop off at the designated courier pickup point',
            ]
          },
          {
            title: '4. Refund Timeline',
            content: [
              'Once vendor receives and inspects the return: 1-2 business days',
              'Refund approval notification sent by email',
              'Credit card refunds: 5-7 business days',
              'COD refunds via bank transfer: 3-5 business days',
            ]
          },
          {
            title: '5. Defective or Wrong Items',
            content: [
              'If you receive a defective or wrong item, contact the vendor within 48 hours',
              'Photos of the item and packaging may be requested',
              'Full replacement or refund will be provided at no cost',
              'Return shipping is covered by the vendor for defective/wrong items',
            ]
          },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg mb-4">{section.title}</h2>
            <ul className="space-y-2">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-midnight-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gold-800 mb-3">Have a return request or need assistance?</p>
          <Link href={`/${locale}/rfq`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
            Contact Support →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
