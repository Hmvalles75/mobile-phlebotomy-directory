import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Detroit, MI | At-Home Lab Services 2026',
  description: 'Professional in-home blood draw services in Detroit, MI. Licensed phlebotomists come to your residence for convenient lab specimen collection. Medicare accepted, flexible scheduling.',
  keywords: 'in-home blood draw Detroit, at-home blood draw Detroit MI, home blood collection Detroit, blood draw at home Wayne County, Detroit home lab services',
  openGraph: {
    title: 'In-Home Blood Draw Services in Detroit, MI',
    description: 'Certified phlebotomists provide professional blood collection in your Detroit home. Convenient, safe, and accurate specimen collection.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/detroit-mi/in-home-blood-draw',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'In-Home Blood Draw Detroit, MI | At-Home Lab Services',
    description: 'Professional in-home blood draw services in Detroit. Licensed phlebotomists, Medicare accepted, convenient scheduling.',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/detroit-mi/in-home-blood-draw',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
