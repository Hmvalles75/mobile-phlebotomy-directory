import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Blood Draw at Home San Diego CA | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving San Diego, CA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home San Diego CA',
    description: 'Licensed mobile phlebotomists serving San Diego, CA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/san-diego-ca/blood-draw-at-home`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
