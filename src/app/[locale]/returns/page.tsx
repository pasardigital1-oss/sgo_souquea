import StaticPage from '@/components/shared/StaticPage'

type Props = { params: Promise<{ locale: string }> }

export default async function ReturnPolicyPage({ params }: Props) {
  await params
  return <StaticPage slug="returns" icon="🔄" fallbackTitle="Return Policy" />
}
