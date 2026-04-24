import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mobilephlebotomy.org/how-to-get-patients-as-a-mobile-phlebotomist',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
