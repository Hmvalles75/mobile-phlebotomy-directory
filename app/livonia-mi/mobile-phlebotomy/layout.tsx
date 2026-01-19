import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Livonia, MI | At-Home Blood Draws 2026',
  description: 'Mobile phlebotomy services in Livonia, MI. Licensed phlebotomists provide professional at-home blood draws. Insurance accepted, flexible scheduling.',
  keywords: 'mobile phlebotomy Livonia, at-home blood draw Livonia MI, Livonia mobile blood draw',
  openGraph: {
    title: 'Mobile Phlebotomy in Livonia, MI',
    description: 'Professional at-home blood draw services in Livonia. Licensed phlebotomists, convenient scheduling.',
    type: 'website',
    url: 'https://mobilephlebotomy.org/livonia-mi/mobile-phlebotomy',
  },
  alternates: {
    canonical: 'https://mobilephlebotomy.org/livonia-mi/mobile-phlebotomy',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
