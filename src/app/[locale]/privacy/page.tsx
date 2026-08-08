import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StaticPage from '@/components/shared/StaticPage'

type Props = { params: Promise<{ locale: string }> }

export default async function PrivacyPolicyPage({ params }: Props) {
  await params
  return <StaticPage slug="privacy" icon="🔒" fallbackTitle="Privacy Policy" />
}
