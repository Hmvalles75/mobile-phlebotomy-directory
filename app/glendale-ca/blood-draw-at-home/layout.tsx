import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Glendale CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Glendale, CA. Certified mobile phlebotomists serving Glendale and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Glendale CA',
    description: 'Get a blood draw at home in Glendale, CA. Certified mobile phlebotomists serving Glendale and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/glendale-ca/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
