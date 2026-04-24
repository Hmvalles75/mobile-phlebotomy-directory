import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Warren MI | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Warren, MI. Certified mobile phlebotomists serving Warren and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Warren MI',
    description: 'Get a blood draw at home in Warren, MI. Certified mobile phlebotomists serving Warren and surrounding areas.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/warren-mi/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
