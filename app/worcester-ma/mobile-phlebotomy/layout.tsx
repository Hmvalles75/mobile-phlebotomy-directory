import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Worcester MA | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Worcester MA',
    description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/worcester-ma/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
