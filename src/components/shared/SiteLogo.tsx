'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  locale?: string
  className?: string
  imgClassName?: string
  showText?: boolean
  textColor?: 'dark' | 'light'
  size?: number
  subtitle?: string
}

// Global cache so we don't re-fetch on every render
let cachedLogoUrl: string | null | undefined = undefined

export default function SiteLogo({
  locale,
  className = '',
  imgClassName = '',
  showText = true,
  textColor = 'dark',
  size = 32,
  subtitle,
}: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(
    cachedLogoUrl !== undefined ? cachedLogoUrl : null
  )

  useEffect(() => {
    if (cachedLogoUrl !== undefined) {
      setLogoUrl(cachedLogoUrl)
      return
    }
    const supabase = createClient()
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'logo_url')
      .single()
      .then(({ data }) => {
        const url = data?.value ?? 'https://kelfndholimoyeyqmckw.supabase.co/storage/v1/object/public/site-assets/logo/platform-logo.png'
        cachedLogoUrl = url
        setLogoUrl(url)
      })
  }, [])

  const imgSrc = logoUrl ?? 'https://kelfndholimoyeyqmckw.supabase.co/storage/v1/object/public/site-assets/logo/platform-logo.png'
  const nameColor = textColor === 'light' ? 'text-white' : 'text-midnight-900'

  const content = (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src={imgSrc}
        alt="SGO-SouqUAE"
        width={size}
        height={size}
        className={`rounded-lg object-contain shrink-0 ${imgClassName}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // fallback to gold S box if image fails
          const el = e.currentTarget
          el.style.display = 'none'
          const parent = el.parentElement
          if (parent && !parent.querySelector('.logo-fallback')) {
            const fallback = document.createElement('div')
            fallback.className = `logo-fallback w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm`
            fallback.style.background = 'linear-gradient(135deg, #c9a84c, #f0d080)'
            fallback.style.width = `${size}px`
            fallback.style.height = `${size}px`
            fallback.textContent = 'S'
            parent.insertBefore(fallback, el)
          }
        }}
      />
      {showText && (
        <span className="leading-none">
          <span className={`font-heading font-bold ${nameColor} text-sm block`}>
            SGO<span className="gold-text">Souq</span>
          </span>
          <span className={`text-[10px] uppercase tracking-widest block ${textColor === 'light' ? 'text-midnight-400' : 'text-midnight-400'}`}>
            {subtitle ?? 'UAE'}
          </span>
        </span>
      )}
    </span>
  )

  if (locale) {
    return <Link href={`/${locale}`}>{content}</Link>
  }
  return content
}
