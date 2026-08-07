import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Southfield MI | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Southfield, MI. Certified mobile phlebotomists serving Southfield and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Southfield MI',
    description: 'Get a blood draw at home in Southfield, MI. Certified mobile phlebotomists serving Southfield and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/southfield-mi/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
