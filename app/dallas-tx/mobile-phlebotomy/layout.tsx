import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Dallas TX | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Dallas, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Dallas TX',
    description: 'Licensed mobile phlebotomists serving Dallas, TX and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/dallas-tx/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
