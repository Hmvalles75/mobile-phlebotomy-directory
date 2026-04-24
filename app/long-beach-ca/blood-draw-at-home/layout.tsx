import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Long Beach CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Long Beach, CA. Certified mobile phlebotomists serving Long Beach and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Long Beach CA',
    description: 'Get a blood draw at home in Long Beach, CA. Certified mobile phlebotomists serving Long Beach and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/long-beach-ca/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
