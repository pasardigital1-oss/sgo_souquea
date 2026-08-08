import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { FileText } from 'lucide-react'

type Props = { params: Promise<{ locale: string }> }

export default async function TermsOfServicePage({ params }: Props) {
  await params

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using SGO-SouqUAE, you agree to be bound by these Terms of Service and all applicable UAE laws and regulations. If you do not agree, please do not use our platform.`
    },
    {
      title: '2. Platform Description',
      content: `SGO-SouqUAE is a multi-vendor marketplace connecting buyers and sellers of automotive spare parts across the UAE. We act as a platform intermediary and are not the seller of record for any products listed by third-party vendors.`
    },
    {
      title: '3. User Accounts',
      content: `• You must be 18 years or older to create an account
• You are responsible for maintaining the security of your account
• You must provide accurate and complete information during registration
• One person may not maintain more than one account
• We reserve the right to suspend or terminate accounts that violate these terms`
    },
    {
      title: '4. Vendor Obligations',
      content: `Vendors on our platform must:
• Hold a valid UAE Trade License
• Comply with all UAE consumer protection laws
• List only genuine, accurately described products
• Honor all orders placed through the platform
• Maintain adequate stock levels as listed
• Respond to customer inquiries within 24 hours
• Issue proper VAT invoices for all transactions`
    },
    {
      title: '5. Buyer Obligations',
      content: `Buyers on our platform must:
• Provide accurate shipping information
• Pay for orders in full at time of purchase
• Use the platform only for lawful purposes
• Not attempt to circumvent the platform to transact directly with vendors`
    },
    {
      title: '6. Pricing & VAT',
      content: `All prices displayed on SGO-SouqUAE include 5% VAT as required by UAE Federal Tax Authority (FTA) regulations. VAT invoices are automatically generated for every transaction and available for download from your order history.`
    },
    {
      title: '7. Intellectual Property',
      content: `The SGO-SouqUAE name, logo, and platform design are the property of Pasar Digital. Vendors retain ownership of their product listings and images. You may not copy, reproduce, or distribute any content from our platform without written permission.`
    },
    {
      title: '8. Limitation of Liability',
      content: `SGO-SouqUAE is not liable for:
• Product defects or quality issues (vendor responsibility)
• Delivery delays caused by couriers
• Losses arising from incorrect vehicle compatibility
• Any indirect or consequential damages

Our maximum liability in any case is limited to the value of the specific transaction in question.`
    },
    {
      title: '9. Dispute Resolution',
      content: `In case of disputes:
• First, attempt to resolve directly with the vendor through the platform
• If unresolved within 7 days, contact SGO-SouqUAE support
• We will mediate in good faith between buyer and vendor
• Unresolved disputes are subject to UAE jurisdiction`
    },
    {
      title: '10. Governing Law',
      content: `These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.`
    },
    {
      title: '11. Changes to Terms',
      content: `We may update these Terms periodically. Continued use of the platform after changes are posted constitutes acceptance of the new Terms. We will notify registered users of material changes via email.`
    },
    {
      title: '12. Contact',
      content: `For questions about these Terms:
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
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-midnight-400 text-sm">Last updated: August 2026 · Governed by UAE Law</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-5">
          <p className="text-sm text-gold-800">
            Please read these Terms of Service carefully before using SGO-SouqUAE. These terms constitute a legally binding agreement between you and Pasar Digital operating SGO-SouqUAE.
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
