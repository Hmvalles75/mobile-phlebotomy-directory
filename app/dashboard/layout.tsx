import type { Metadata } from 'next'

// /dashboard and /dashboard/login are provider-only and were indexed
// (GSC, 2026-11-18) because the root layout declares index/follow and both
// pages are client components, which cannot carry their own metadata. This
// layout is the nearest server boundary. Deliberately NOT paired with a
// robots.txt Disallow: Google must still fetch the page to see the noindex,
// or the already-indexed URLs would never drop out.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
