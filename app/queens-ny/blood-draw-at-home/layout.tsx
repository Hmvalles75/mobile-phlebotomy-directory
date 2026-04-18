import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Queens NY | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Queens, NY. Certified mobile phlebotomists serving Queens and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Queens NY',
    description: 'Get a blood draw at home in Queens, NY. Certified mobile phlebotomists serving Queens and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
