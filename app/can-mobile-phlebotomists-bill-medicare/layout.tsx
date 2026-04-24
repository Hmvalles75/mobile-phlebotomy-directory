import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/can-mobile-phlebotomists-bill-medicare',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
