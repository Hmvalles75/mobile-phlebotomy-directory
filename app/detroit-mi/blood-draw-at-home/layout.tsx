import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Detroit, MI | Home Blood Testing 2026',
  description: 'Get blood draws at your Detroit home. Licensed phlebotomists provide convenient, accurate specimen collection. Skip the lab visit—professional home blood testing in Wayne County.',
  keywords: 'blood draw at home Detroit, home blood draw Detroit MI, at-home blood test Detroit, blood work at home Wayne County, home phlebotomy Detroit',
  openGraph: {
    title: 'Blood Draw at Home in Detroit, MI',
    description: 'Professional blood draws in your Detroit home. Licensed phlebotomists, accurate results, convenient scheduling.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/detroit-mi/blood-draw-at-home',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/detroit-mi/blood-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
