import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Torrance CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Torrance, CA. Certified mobile phlebotomists serving Torrance and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Torrance CA',
    description: 'Get a blood draw at home in Torrance, CA. Certified mobile phlebotomists serving Torrance and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/torrance-ca/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
