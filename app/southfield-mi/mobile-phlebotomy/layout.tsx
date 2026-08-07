import { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Southfield, MI | At-Home Blood Draws 2026',
  description: 'Mobile phlebotomy services in Southfield, MI. Licensed phlebotomists provide professional at-home blood draws. Insurance accepted.',
  alternates: { canonical: `${SITE_URL}/southfield-mi/mobile-phlebotomy` },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
