import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Santa Monica CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Santa Monica, CA. Certified mobile phlebotomists serving Santa Monica and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Santa Monica CA',
    description: 'Get a blood draw at home in Santa Monica, CA. Certified mobile phlebotomists serving Santa Monica and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/santa-monica-ca/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
