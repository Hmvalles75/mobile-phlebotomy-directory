import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Beverly Hills CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Beverly Hills, CA. Certified mobile phlebotomists serving Beverly Hills and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Beverly Hills CA',
    description: 'Get a blood draw at home in Beverly Hills, CA. Certified mobile phlebotomists serving Beverly Hills and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
