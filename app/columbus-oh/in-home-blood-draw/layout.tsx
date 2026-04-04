import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Columbus OH | Mobile Phlebotomy Services (2026)',
  description: 'Licensed mobile phlebotomists serving Columbus, OH and surrounding areas. At-home blood draws — same-day and next-day available.',
  openGraph: {
    title: 'In-Home Blood Draw Columbus OH',
    description: 'Licensed mobile phlebotomists serving Columbus, OH and surrounding areas. At-home blood draws — same-day and next-day available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
