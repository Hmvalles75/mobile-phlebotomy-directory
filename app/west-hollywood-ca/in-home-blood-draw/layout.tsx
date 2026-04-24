import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw West Hollywood CA | Mobile Phlebotomy Services (2026)',
  description: 'Professional in-home blood draw services in West Hollywood, CA. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
  openGraph: {
    title: 'In-Home Blood Draw West Hollywood CA',
    description: 'Professional in-home blood draw services in West Hollywood, CA. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/west-hollywood-ca/in-home-blood-draw',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
