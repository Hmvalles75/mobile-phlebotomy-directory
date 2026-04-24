import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Worcester MA | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'In-Home Blood Draw Worcester MA',
    description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/worcester-ma/in-home-blood-draw',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
