import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Bronx NY | Mobile Phlebotomy Services (2026)',
  description: 'Professional in-home blood draw services in Bronx, NY. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
  openGraph: {
    title: 'In-Home Blood Draw Bronx NY',
    description: 'Professional in-home blood draw services in Bronx, NY. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/bronx-ny/in-home-blood-draw',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
