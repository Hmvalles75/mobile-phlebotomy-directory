import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lab Draw at Home Detroit, MI | Quest & Labcorp Home Collection 2026',
  description: 'Complete lab work at home in Detroit. Professional specimen collection with transport to Quest, Labcorp, and certified labs. Licensed phlebotomists, insurance accepted.',
  keywords: 'lab draw at home Detroit, Quest at home Detroit MI, Labcorp home collection Detroit, home lab services Wayne County, mobile lab draw Detroit',
  openGraph: {
    title: 'Lab Draw at Home in Detroit, MI',
    description: 'Professional lab specimen collection at your Detroit home. Transport to Quest, Labcorp, and all major laboratories.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/detroit-mi/lab-draw-at-home',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/detroit-mi/lab-draw-at-home',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
