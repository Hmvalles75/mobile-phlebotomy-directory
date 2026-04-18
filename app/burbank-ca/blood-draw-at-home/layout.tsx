import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Burbank CA | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Burbank, CA. Certified mobile phlebotomists serving Burbank and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Burbank CA',
    description: 'Get a blood draw at home in Burbank, CA. Certified mobile phlebotomists serving Burbank and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
