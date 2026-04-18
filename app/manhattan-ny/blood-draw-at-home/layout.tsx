import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Manhattan NY | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Manhattan, NY. Certified mobile phlebotomists serving Manhattan and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Manhattan NY',
    description: 'Get a blood draw at home in Manhattan, NY. Certified mobile phlebotomists serving Manhattan and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
