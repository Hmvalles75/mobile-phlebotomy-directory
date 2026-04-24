import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Houston TX | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Houston, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Houston TX',
    description: 'Licensed mobile phlebotomists serving Houston, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/houston-tx/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
