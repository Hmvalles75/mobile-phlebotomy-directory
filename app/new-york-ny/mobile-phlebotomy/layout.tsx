import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy NYC | At-Home Blood Draw Services in New York',
  description: 'Professional mobile phlebotomy across New York City and Northern New Jersey. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy NYC | At-Home Blood Draw Services',
    description: 'At-home blood draw services across NYC and Northern NJ. Same-day & next-day availability.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/new-york-ny/mobile-phlebotomy`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
