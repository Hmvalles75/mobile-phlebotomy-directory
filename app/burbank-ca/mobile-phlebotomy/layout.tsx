import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Burbank CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Burbank, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Burbank CA',
    description: 'At-home blood draw services in Burbank. Same-day & next-day availability.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/burbank-ca/mobile-phlebotomy`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
