import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Worcester MA | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Worcester MA',
    description: 'Licensed mobile phlebotomists serving Worcester, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
