import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Glendale CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Glendale, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Glendale CA',
    description: 'At-home blood draw services in Glendale. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
