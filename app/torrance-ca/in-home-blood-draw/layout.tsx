import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Torrance CA | Mobile Phlebotomy Services (2026)',
  description: 'Professional in-home blood draw services in Torrance, CA. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
  openGraph: {
    title: 'In-Home Blood Draw Torrance CA',
    description: 'Professional in-home blood draw services in Torrance, CA. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/torrance-ca/in-home-blood-draw',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
