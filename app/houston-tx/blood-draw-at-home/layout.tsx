import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Houston TX | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Houston, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Houston TX',
    description: 'Licensed mobile phlebotomists serving Houston, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
