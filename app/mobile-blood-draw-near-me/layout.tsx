import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/mobile-blood-draw-near-me',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
