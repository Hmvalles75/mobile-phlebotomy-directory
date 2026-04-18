import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Newark NJ | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Newark, NJ. Certified mobile phlebotomists serving Newark and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Newark NJ',
    description: 'Get a blood draw at home in Newark, NJ. Certified mobile phlebotomists serving Newark and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
