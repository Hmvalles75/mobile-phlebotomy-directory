import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Los Angeles CA | Mobile Blood Testing',
  description: 'Convenient blood draw at home services in Los Angeles. Certified phlebotomists come to your residence for professional specimen collection. Same-day & next-day available.',
  openGraph: {
    title: 'Blood Draw at Home Los Angeles CA',
    description: 'Get your blood work done at home in Los Angeles. Same-day & next-day service available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
