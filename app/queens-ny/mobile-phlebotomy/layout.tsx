import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Queens NY | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Queens, NY. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Queens NY',
    description: 'At-home blood draw services in Queens. Same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
