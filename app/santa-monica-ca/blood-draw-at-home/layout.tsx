import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Santa Monica CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Santa Monica, CA. Certified mobile phlebotomists serving Santa Monica and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Santa Monica CA',
    description: 'Get a blood draw at home in Santa Monica, CA. Certified mobile phlebotomists serving Santa Monica and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
