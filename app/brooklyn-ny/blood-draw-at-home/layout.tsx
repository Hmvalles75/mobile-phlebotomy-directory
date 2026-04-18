import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Brooklyn NY | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Brooklyn, NY. Certified mobile phlebotomists serving Brooklyn and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Brooklyn NY',
    description: 'Get a blood draw at home in Brooklyn, NY. Certified mobile phlebotomists serving Brooklyn and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
