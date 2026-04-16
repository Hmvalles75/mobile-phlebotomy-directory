import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Lowell MA | At-Home Blood Draw Services (2026)',
  description: 'Licensed mobile phlebotomists serving Lowell, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'Mobile Phlebotomy Lowell MA',
    description: 'Licensed mobile phlebotomists serving Lowell, MA and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
