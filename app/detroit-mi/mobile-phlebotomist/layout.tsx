import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomist Detroit, MI | Find Certified Providers 2026',
  description: 'Find qualified mobile phlebotomists in Detroit, MI. Licensed, certified professionals for at-home blood draws. Verify credentials, read reviews, compare Detroit area providers.',
  keywords: 'mobile phlebotomist Detroit, Detroit mobile phlebotomy professional, certified phlebotomist Detroit MI, licensed mobile phlebotomist Wayne County',
  openGraph: {
    title: 'Find a Mobile Phlebotomist in Detroit, MI',
    description: 'Directory of certified mobile phlebotomists serving Detroit and Wayne County. Licensed professionals, verified credentials.',
    type: 'website',
    url: `${SITE_URL}/detroit-mi/mobile-phlebotomist`,
  },
  alternates: {
    canonical: `${SITE_URL}/detroit-mi/mobile-phlebotomist`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
