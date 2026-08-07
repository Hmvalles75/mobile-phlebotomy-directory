import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  alternates: {
    canonical: `${SITE_URL}/metros`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
