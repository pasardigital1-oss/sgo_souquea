import Link from 'next/link'

interface Props {
  locale?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { img: 28, text: 'text-base' },
  md: { img: 36, text: 'text-lg' },
  lg: { img: 48, text: 'text-2xl' },
}

export default function Logo({ locale, size = 'md', showText = true, className = '' }: Props) {
  const s = sizes[size]
  const content = (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="https://kelfndholimoyeyqmckw.supabase.co/storage/v1/object/public/site-assets/logo/platform-logo.png"
        alt="SGO-SouqUAE"
        width={s.img}
        height={s.img}
        className="rounded-lg object-contain shrink-0"
        style={{ width: s.img, height: s.img }}
      />
      {showText && (
        <span className={`font-heading font-bold text-midnight-900 ${s.text} leading-none`}>
          SGO<span className="gold-text">Souq</span>
          <span className="block text-midnight-400 text-[10px] leading-none tracking-widest uppercase">UAE</span>
        </span>
      )}
    </span>
  )

  if (locale) {
    return <Link href={`/${locale}`}>{content}</Link>
  }
  return content
}
