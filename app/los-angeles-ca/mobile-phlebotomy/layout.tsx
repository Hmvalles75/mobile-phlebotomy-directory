import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mobile Phlebotomy Los Angeles CA | At-Home Blood Draw Services',
  description: 'Professional mobile phlebotomy services in Los Angeles, CA. Licensed phlebotomists come to your home for convenient blood draws. Same-day & next-day appointments available. Serving all LA County.',
  keywords: 'mobile phlebotomy los angeles, blood draw at home los angeles, in home blood draw los angeles, mobile blood draw LA, at home phlebotomy los angeles',
  openGraph: {
    title: 'Mobile Phlebotomy Los Angeles CA | At-Home Blood Draw Services',
    description: 'Same-day & next-day mobile blood draw services in Los Angeles. Licensed phlebotomists come to your home, office, or preferred location.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
