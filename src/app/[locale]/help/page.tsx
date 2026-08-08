import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { HelpCircle, MessageSquare, Package, CreditCard, Truck, Star } from 'lucide-react'

type Props = { params: Promise<{ locale: string }> }

export default async function HelpCenterPage({ params }: Props) {
  const { locale } = await params

  const faqs = [
    {
      category: 'Orders & Checkout',
      icon: Package,
      color: 'text-blue-500 bg-blue-50',
      items: [
        { q: 'How do I place an order?', a: 'Browse the catalog, add items to cart, then proceed to checkout. Fill in your shipping address and choose a payment method.' },
        { q: 'Can I cancel my order?', a: 'Orders can be cancelled while still in "Pending" status. Once confirmed by the vendor, contact them directly to discuss cancellation.' },
        { q: 'How do I track my order?', a: 'Go to My Orders page to see real-time status updates from the vendor.' },
        { q: 'What is the minimum order?', a: 'There is no minimum order requirement. You can order even a single part.' },
      ]
    },
    {
      category: 'Payment & VAT',
      icon: CreditCard,
      color: 'text-green-500 bg-green-50',
      items: [
        { q: 'Are prices inclusive of VAT?', a: 'Yes. All prices displayed include 5% VAT as per UAE Federal Tax Authority regulations.' },
        { q: 'What payment methods are accepted?', a: 'Cash on Delivery, Stripe (credit/debit card), Telr, Tabby (pay in 4), and Tamara (pay in 3).' },
        { q: 'Can I get a tax invoice?', a: 'Yes. After your order, go to My Orders and click "Download Invoice" for a UAE FTA-compliant tax invoice.' },
        { q: 'Is my payment information secure?', a: 'All payment data is handled by certified payment gateways. We never store your card details.' },
      ]
    },
    {
      category: 'Shipping & Delivery',
      icon: Truck,
      color: 'text-orange-500 bg-orange-50',
      items: [
        { q: 'Which emirates do you deliver to?', a: 'We deliver across all 7 Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain, and Fujairah.' },
        { q: 'How long does delivery take?', a: 'Delivery time depends on the vendor and courier. Typically 1-3 days within the same emirate, 2-5 days cross-emirate.' },
        { q: 'What are the shipping fees?', a: 'Shipping fees are determined by the vendor based on weight and delivery location. Many vendors offer free shipping.' },
      ]
    },
    {
      category: 'Returns & Refunds',
      icon: Star,
      color: 'text-purple-500 bg-purple-50',
      items: [
        { q: 'What is the return policy?', a: 'Returns are accepted within 7 days of delivery for unused parts in original packaging. Contact the vendor directly to initiate a return.' },
        { q: 'How do I get a refund?', a: 'Once the vendor approves the return, refunds are processed within 5-7 business days to your original payment method.' },
        { q: 'What if I receive a wrong part?', a: 'Contact the vendor immediately via the order page. Wrong items are replaced or refunded at no cost to you.' },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gold-gradient mb-4">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-midnight-400 text-sm">Find answers to common questions about SGO-SouqUAE</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {faqs.map(section => {
          const Icon = section.icon
          return (
            <div key={section.category} className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="font-heading font-semibold text-midnight-900">{section.category}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {section.items.map((item, i) => (
                  <details key={i} className="group p-5">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <p className="font-semibold text-midnight-900 text-sm pr-4">{item.q}</p>
                      <span className="text-gold-500 text-lg shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-midnight-500 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )
        })}

        {/* Still need help */}
        <div className="bg-midnight-900 rounded-2xl p-8 text-center">
          <MessageSquare className="w-10 h-10 text-gold-400 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-white text-lg mb-2">Still need help?</h3>
          <p className="text-midnight-400 text-sm mb-5">Can't find what you're looking for? Submit a request and we'll get back to you.</p>
          <Link href={`/${locale}/rfq`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
            Contact Support →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
