import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Santa Monica CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Santa Monica, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Santa Monica CA',
    description: 'At-home blood draw services in Santa Monica. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
