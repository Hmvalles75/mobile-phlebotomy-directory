import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Dallas TX | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Dallas, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'In-Home Blood Draw Dallas TX',
    description: 'Licensed mobile phlebotomists serving Dallas, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/dallas-tx/in-home-blood-draw`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
