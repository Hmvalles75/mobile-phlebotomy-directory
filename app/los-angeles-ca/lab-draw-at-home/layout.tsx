import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lab Draw at Home Los Angeles CA | Mobile Lab Collection',
  description: 'Professional lab specimen collection at your Los Angeles home. Works with Quest, Labcorp, and other major labs. Same-day & next-day service available.',
  openGraph: {
    title: 'Lab Draw at Home Los Angeles CA',
    description: 'Home lab specimen collection in Los Angeles. Professional service with same-day & next-day availability.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
