import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Shield } from 'lucide-react'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPolicyPage({ params }: Props) {
  await params

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This includes:
• Name, email address, and phone number
• Shipping and billing address
• Payment information (processed securely by our payment partners)
• Vehicle information saved in My Garage
• Order history and preferences
• Device and usage information when you browse our platform`
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:
• Process and fulfill your orders
• Send order confirmations, invoices, and shipping updates
• Provide customer support
• Improve our platform and user experience
• Send promotional communications (with your consent)
• Comply with UAE legal obligations, including VAT reporting to FTA
• Detect and prevent fraud`
    },
    {
      title: '3. Information Sharing',
      content: `We share your information only as necessary:
• With vendors to fulfill your orders (name, phone, shipping address)
• With payment processors to complete transactions
• With logistics partners for delivery
• With UAE government authorities as required by law (e.g., FTA for VAT compliance)
• We never sell your personal data to third parties`
    },
    {
      title: '4. Data Storage & Security',
      content: `Your data is stored on secure servers hosted by Supabase with infrastructure in compliance with international security standards. We implement:
• Encryption of data in transit (TLS/HTTPS)
• Row-level security on all database tables
• Regular security audits
• Access controls limiting who can view your data`
    },
    {
      title: '5. Your Rights (UAE PDPL)',
      content: `Under UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL), you have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion of your data
• Object to processing of your data
• Data portability
To exercise these rights, contact us at support@sgosouquae.com`
    },
    {
      title: '6. Cookies',
      content: `We use essential cookies to maintain your session and preferences. We do not use tracking cookies for advertising purposes. You can control cookie settings in your browser.`
    },
    {
      title: '7. Children\'s Privacy',
      content: `Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from minors.`
    },
    {
      title: '8. Contact Us',
      content: `For privacy-related inquiries:
Email: support@sgosouquae.com
Address: Dubai, United Arab Emirates`
    },
  ]

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gold-gradient mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-midnight-400 text-sm">Last updated: August 2026 · Compliant with UAE PDPL</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm text-blue-700">
            This Privacy Policy describes how SGO-SouqUAE collects, uses, and protects your personal information in accordance with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL).
          </p>
        </div>

        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-6">
            <h2 className="font-heading font-semibold text-midnight-900 text-lg mb-3">{section.title}</h2>
            <p className="text-sm text-midnight-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  )
}
