import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/resources',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
