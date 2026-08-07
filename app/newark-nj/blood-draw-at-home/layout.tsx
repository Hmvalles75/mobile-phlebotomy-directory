import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Newark NJ | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Newark, NJ. Certified mobile phlebotomists serving Newark and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Newark NJ',
    description: 'Get a blood draw at home in Newark, NJ. Certified mobile phlebotomists serving Newark and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/newark-nj/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
