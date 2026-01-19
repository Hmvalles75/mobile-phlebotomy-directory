import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Detroit, MI | At-Home Blood Draws 2026',
  description: 'Find certified mobile phlebotomy services in Detroit, MI. Professional at-home blood draws throughout Wayne County. Licensed phlebotomists, insurance accepted, 24-48 hour appointments.',
  keywords: 'mobile phlebotomy Detroit, at-home blood draw Detroit MI, mobile blood draw Detroit, phlebotomist Detroit Michigan, home blood collection Wayne County',
  openGraph: {
    title: 'Mobile Phlebotomy in Detroit, MI | Professional At-Home Blood Draws',
    description: 'Licensed mobile phlebotomists serving Detroit and Wayne County. Convenient at-home blood draws with certified professionals. Insurance accepted.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/detroit-mi/mobile-phlebotomy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobile Phlebotomy Detroit, MI | At-Home Blood Draws',
    description: 'Find certified mobile phlebotomy services in Detroit. Professional at-home blood draws, insurance accepted, convenient scheduling.',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/detroit-mi/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
