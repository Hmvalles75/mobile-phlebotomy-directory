import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/terms',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
