import StaticPage from '@/components/shared/StaticPage'

type Props = { params: Promise<{ locale: string }> }

export default async function TermsPage({ params }: Props) {
  await params
  return <StaticPage slug="terms" icon="📄" fallbackTitle="Terms of Service" />
}
