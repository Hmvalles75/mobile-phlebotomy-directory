import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Manhattan NY | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Manhattan, NY. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Manhattan NY',
    description: 'At-home blood draw services in Manhattan. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
