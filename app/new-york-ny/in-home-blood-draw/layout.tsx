import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy In-Home Blood Draw NYC NY | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in In-Home Blood Draw NYC, NY. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy In-Home Blood Draw NYC NY',
    description: 'At-home blood draw services in In-Home Blood Draw NYC. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
