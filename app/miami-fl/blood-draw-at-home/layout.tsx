import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Miami FL | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Miami, FL and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Miami FL',
    description: 'Licensed mobile phlebotomists serving Miami, FL and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/miami-fl/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
