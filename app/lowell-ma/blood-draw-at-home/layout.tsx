import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Lowell MA | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Lowell, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Lowell MA',
    description: 'Licensed mobile phlebotomists serving Lowell, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/lowell-ma/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
