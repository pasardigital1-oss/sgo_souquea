import StaticPage from '@/components/shared/StaticPage'

type Props = { params: Promise<{ locale: string }> }

export default async function HelpCenterPage({ params }: Props) {
  await params
  return <StaticPage slug="help" icon="❓" fallbackTitle="Help Center" />
}
