import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Charlotte NC | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Charlotte NC',
    description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/charlotte-nc/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
