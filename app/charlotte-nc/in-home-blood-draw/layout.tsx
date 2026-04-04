import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Charlotte NC | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'In-Home Blood Draw Charlotte NC',
    description: 'Licensed mobile phlebotomists serving Charlotte, NC and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
