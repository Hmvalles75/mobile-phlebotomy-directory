import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Staten Island NY | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Staten Island, NY. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Staten Island NY',
    description: 'At-home blood draw services in Staten Island. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
