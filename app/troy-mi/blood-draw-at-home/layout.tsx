import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Troy MI | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Troy, MI. Certified mobile phlebotomists serving Troy and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Troy MI',
    description: 'Get a blood draw at home in Troy, MI. Certified mobile phlebotomists serving Troy and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/troy-mi/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
