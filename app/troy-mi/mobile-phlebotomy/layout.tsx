import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Troy, MI | At-Home Blood Draws 2026',
  description: 'Mobile phlebotomy services in Troy, MI. Licensed phlebotomists provide professional at-home blood draws. Insurance accepted.',
  alternates: { canonical: `${SITE_URL}/troy-mi/mobile-phlebotomy` },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
