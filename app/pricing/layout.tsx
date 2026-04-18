import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Provider Pricing | Premium Directory Listings & Website Services',
  description: 'Pricing for mobile phlebotomy providers \u2014 free directory listing, premium featured placement tiers, and professional website setup service.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'MobilePhlebotomy.org Provider Pricing',
    description: 'Free directory listing plus optional premium tiers and website setup.',
    type: 'website',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
