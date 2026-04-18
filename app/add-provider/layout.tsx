import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Mobile Phlebotomy Business Free | Get Patient Referrals',
  description: 'Join the leading mobile phlebotomy directory. Free listing, patient lead notifications, and exposure to thousands of at-home blood draw searches monthly.',
  alternates: { canonical: '/add-provider' },
  openGraph: {
    title: 'List Your Mobile Phlebotomy Business Free',
    description: 'Free directory listing + patient lead notifications for independent mobile phlebotomists.',
    type: 'website',
  },
}

export default function AddProviderLayout({ children }: { children: React.ReactNode }) {
  return children
}
