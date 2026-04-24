import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Jersey City NJ | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Jersey City, NJ. Certified mobile phlebotomists serving Jersey City and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Jersey City NJ',
    description: 'Get a blood draw at home in Jersey City, NJ. Certified mobile phlebotomists serving Jersey City and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/jersey-city-nj/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
