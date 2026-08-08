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

export default function StaticPage({ slug, icon, fallbackTitle }: Props) {
  const [title, setTitle] = useState(fallbackTitle)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('pages').select('title, content').eq('slug', slug).single()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title)
          setContent(data.content)
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
