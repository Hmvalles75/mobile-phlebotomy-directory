import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Dearborn, MI | At-Home Blood Draws 2026',
  description: 'Mobile phlebotomy services in Dearborn, MI. Licensed phlebotomists provide professional at-home blood draws throughout Dearborn and Wayne County. Insurance accepted, flexible scheduling.',
  keywords: 'mobile phlebotomy Dearborn, at-home blood draw Dearborn MI, Dearborn mobile blood draw, phlebotomist Dearborn Michigan',
  openGraph: {
    title: 'Mobile Phlebotomy in Dearborn, MI',
    description: 'Professional at-home blood draw services in Dearborn. Licensed phlebotomists, convenient scheduling, insurance accepted.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/dearborn-mi/mobile-phlebotomy',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/dearborn-mi/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
