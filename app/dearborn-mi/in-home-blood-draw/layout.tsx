import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Dearborn MI | Mobile Phlebotomy Services (2026)',
  description: 'Professional in-home blood draw services in Dearborn, MI. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
  openGraph: {
    title: 'In-Home Blood Draw Dearborn MI',
    description: 'Professional in-home blood draw services in Dearborn, MI. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/dearborn-mi/in-home-blood-draw`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
