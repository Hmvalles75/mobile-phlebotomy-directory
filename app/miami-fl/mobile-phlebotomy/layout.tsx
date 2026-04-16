import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Miami FL | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Miami, FL and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Miami FL',
    description: 'Licensed mobile phlebotomists serving Miami, FL and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
