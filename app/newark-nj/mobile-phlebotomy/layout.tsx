import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Newark NJ | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Newark, NJ. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Newark NJ',
    description: 'At-home blood draw services in Newark. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
