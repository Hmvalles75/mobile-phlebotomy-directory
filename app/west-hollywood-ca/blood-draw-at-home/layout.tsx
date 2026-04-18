import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home West Hollywood CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in West Hollywood, CA. Certified mobile phlebotomists serving West Hollywood and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home West Hollywood CA',
    description: 'Get a blood draw at home in West Hollywood, CA. Certified mobile phlebotomists serving West Hollywood and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
