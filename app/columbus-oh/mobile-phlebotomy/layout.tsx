import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Columbus OH | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Columbus, OH and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Columbus OH',
    description: 'Licensed mobile phlebotomists serving Columbus, OH and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/columbus-oh/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
