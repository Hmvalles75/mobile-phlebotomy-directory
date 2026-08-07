import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Jersey City NJ | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Jersey City, NJ. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Jersey City NJ',
    description: 'At-home blood draw services in Jersey City. Same-day & next-day availability.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/jersey-city-nj/mobile-phlebotomy`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
