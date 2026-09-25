import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern use of the MobilePhlebotomy.org directory and its provider matching service.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
