import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Staten Island NY | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Staten Island, NY. Certified mobile phlebotomists serving Staten Island and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Staten Island NY',
    description: 'Get a blood draw at home in Staten Island, NY. Certified mobile phlebotomists serving Staten Island and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/staten-island-ny/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
