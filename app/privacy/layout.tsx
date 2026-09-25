import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How MobilePhlebotomy.org collects, uses and protects patient and provider information.',
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
