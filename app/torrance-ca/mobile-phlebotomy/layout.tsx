import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Torrance CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Torrance, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Torrance CA',
    description: 'At-home blood draw services in Torrance. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
