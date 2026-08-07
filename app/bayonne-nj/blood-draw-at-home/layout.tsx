import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Bayonne NJ | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Bayonne, NJ. Certified mobile phlebotomists serving Bayonne and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Bayonne NJ',
    description: 'Get a blood draw at home in Bayonne, NJ. Certified mobile phlebotomists serving Bayonne and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/bayonne-nj/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
