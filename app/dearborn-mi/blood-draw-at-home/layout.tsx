import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Dearborn MI | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Dearborn, MI. Certified mobile phlebotomists serving Dearborn and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Dearborn MI',
    description: 'Get a blood draw at home in Dearborn, MI. Certified mobile phlebotomists serving Dearborn and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
