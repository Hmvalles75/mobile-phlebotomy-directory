import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Beverly Hills CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Beverly Hills, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Beverly Hills CA',
    description: 'At-home blood draw services in Beverly Hills. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
