import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Bronx NY | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Bronx, NY. Certified mobile phlebotomists serving Bronx and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Bronx NY',
    description: 'Get a blood draw at home in Bronx, NY. Certified mobile phlebotomists serving Bronx and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/bronx-ny/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
