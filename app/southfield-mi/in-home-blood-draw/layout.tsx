import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Southfield MI | Mobile Phlebotomy Services (2026)',
  description: 'Professional in-home blood draw services in Southfield, MI. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
  openGraph: {
    title: 'In-Home Blood Draw Southfield MI',
    description: 'Professional in-home blood draw services in Southfield, MI. Licensed mobile phlebotomists come to you — same-day and next-day appointments available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
