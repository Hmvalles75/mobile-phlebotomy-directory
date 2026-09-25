import type { Metadata } from 'next'

// The only /[city]/request route on the site (checked 2026-09-25). It is a
// lead form reached with ?providerId=; Google indexed eight query variants,
// each inheriting the root layout's homepage canonical. A form is not a
// landing page: keep it crawlable for links, out of the index.
export const metadata: Metadata = {
  title: 'Request a Blood Draw in Los Angeles',
  robots: { index: false, follow: true },
  alternates: { canonical: '/los-angeles/request' },
}

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children
}
