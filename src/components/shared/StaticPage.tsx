'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface Props {
  slug: string
  icon: string
  fallbackTitle: string
}

const FALLBACK_CONTENT: Record<string, { title: string; content: string }> = {
  privacy: {
    title: 'Privacy Policy',
    content: `## Privacy Policy\n\nLast updated: August 2026\n\n### Information We Collect\nWe collect information you provide directly to us, such as your name, email address, phone number, and shipping address when you create an account or place an order.\n\n### How We Use Your Information\nWe use the information we collect to process your orders, send order confirmations and updates, provide customer support, and improve our services.\n\n### Information Sharing\nWe do not sell or rent your personal information to third parties. We may share your information with vendors to fulfill your orders and with logistics partners to deliver your purchases.\n\n### Data Security\nWe implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.\n\n### Contact Us\nIf you have questions about this Privacy Policy, please contact us at support@sgosouquae.com`,
  },
  terms: {
    title: 'Terms of Service',
    content: `## Terms of Service\n\nLast updated: August 2026\n\n### Acceptance of Terms\nBy using SGO-SouqUAE, you agree to these Terms of Service. If you do not agree, please do not use our platform.\n\n### Platform Description\nSGO-SouqUAE is a marketplace connecting buyers and sellers of auto parts in the UAE. We facilitate transactions but are not a party to the sale.\n\n### User Responsibilities\n- Provide accurate information when creating your account\n- Keep your account credentials secure\n- Use the platform only for lawful purposes\n- Comply with UAE laws and regulations\n\n### Vendor Obligations\nVendors must hold a valid UAE trade license, accurately describe their products, and fulfill orders promptly.\n\n### Limitation of Liability\nSGO-SouqUAE is not liable for the quality, safety, or legality of items listed, the accuracy of listings, or the ability of sellers to sell or buyers to pay.\n\n### Contact\nsupport@sgosouquae.com`,
  },
  returns: {
    title: 'Return & Refund Policy',
    content: `## Return & Refund Policy\n\nLast updated: August 2026\n\n### Return Eligibility\nItems may be returned within 7 days of delivery if they are:\n- Defective or damaged upon arrival\n- Significantly different from the product description\n- Incorrect parts delivered\n\n### Return Process\n1. Contact the vendor through your order page within 7 days\n2. Describe the issue and attach photos\n3. Wait for vendor confirmation (within 48 hours)\n4. Ship the item back with the provided return label\n\n### Refund Timeline\nRefunds are processed within 5-7 business days after the vendor receives the return. Refunds are issued to the original payment method.\n\n### Non-Returnable Items\n- Electrical components that have been installed\n- Items damaged due to improper installation\n- Items returned after 7 days\n\n### Contact\nFor return assistance: support@sgosouquae.com`,
  },
  help: {
    title: 'Help Center',
    content: `## Help Center\n\n### Getting Started\n\n**How do I create an account?**\nClick "Sign Up" and enter your name, email, and password. You'll receive a confirmation email.\n\n**How do I search for parts?**\nUse the search bar on the catalog page, or filter by vehicle make/model, category, or part type. You can also use our VIN decoder to find compatible parts.\n\n### Ordering\n\n**How do I place an order?**\nAdd items to your cart, proceed to checkout, enter your delivery address, select a payment method, and click "Place Order".\n\n**Can I cancel my order?**\nOrders can only be cancelled before the vendor confirms them. Contact the vendor immediately if you need to cancel.\n\n### Delivery\n\n**How long does delivery take?**\nDelivery within the same emirate typically takes 1-2 business days. Cross-emirate delivery takes 2-4 business days.\n\n### Contact Support\n📧 support@sgosouquae.com\n📞 +971 XX XXX XXXX\n⏰ Sunday–Thursday, 9am–6pm GST`,
  },
}

export default function StaticPage({ slug, icon, fallbackTitle }: Props) {
  const [title, setTitle] = useState(fallbackTitle)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('pages').select('title, content').eq('slug', slug).single()
      .then(({ data }) => {
        if (data?.content) {
          setTitle(data.title)
          setContent(data.content)
        } else {
          // Use fallback content if DB is empty
          const fallback = FALLBACK_CONTENT[slug]
          if (fallback) {
            setTitle(fallback.title)
            setContent(fallback.content)
          }
        }
        setLoading(false)
      })
  }, [slug])

  // Simple markdown-like renderer
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return (
        <h2 key={i} className="font-heading text-2xl font-bold text-midnight-900 mt-8 mb-4 first:mt-0">{line.slice(3)}</h2>
      )
      if (line.startsWith('### ')) return (
        <h3 key={i} className="font-heading text-lg font-semibold text-midnight-900 mt-6 mb-2">{line.slice(4)}</h3>
      )
      if (line.startsWith('**') && line.endsWith('**')) return (
        <p key={i} className="font-semibold text-midnight-900 text-sm mt-3 mb-1">{line.slice(2, -2)}</p>
      )
      if (line.startsWith('- ')) return (
        <li key={i} className="text-sm text-midnight-600 ml-4 mb-1 list-disc">{line.slice(2)}</li>
      )
      if (line.match(/^\d+\./)) return (
        <li key={i} className="text-sm text-midnight-600 ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
      )
      if (line === '---') return (
        <hr key={i} className="my-6 border-gray-200" />
      )
      if (line.trim() === '') return <div key={i} className="h-2" />
      return (
        <p key={i} className="text-sm text-midnight-600 leading-relaxed mb-1">{line}</p>
      )
    })
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="bg-midnight-900 border-b border-white/5">
        <div className="h-0.5 gold-gradient" />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gold-gradient mb-4 text-2xl">
            {icon}
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-midnight-400 text-xs">Last updated: August 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : content ? (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-8">
            <ul className="contents">
              {renderContent(content)}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 luxury-shadow p-8 text-center text-midnight-400">
            Content coming soon.
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
