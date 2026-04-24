import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy San Diego CA | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving San Diego, CA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy San Diego CA',
    description: 'Licensed mobile phlebotomists serving San Diego, CA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/san-diego-ca/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
