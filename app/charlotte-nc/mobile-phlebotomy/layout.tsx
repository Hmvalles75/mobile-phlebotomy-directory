import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Charlotte NC | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Charlotte NC',
    description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/charlotte-nc/mobile-phlebotomy`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
