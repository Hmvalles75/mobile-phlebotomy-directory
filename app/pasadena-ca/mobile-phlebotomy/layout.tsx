import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Pasadena CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy in Pasadena, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available.',
  openGraph: {
    title: 'Mobile Phlebotomy Pasadena CA',
    description: 'At-home blood draw services in Pasadena. Same-day & next-day availability.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/pasadena-ca/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
