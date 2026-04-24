import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Chicago IL | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Chicago, IL and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Chicago IL',
    description: 'Licensed mobile phlebotomists serving Chicago, IL and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/chicago-il/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
