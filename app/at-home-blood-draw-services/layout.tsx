import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/at-home-blood-draw-services',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
