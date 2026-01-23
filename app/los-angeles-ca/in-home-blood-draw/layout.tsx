import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'In-Home Blood Draw Los Angeles CA | Mobile Phlebotomy Services',
  description: 'Professional in-home blood draw services in Los Angeles. Licensed phlebotomists come to your residence for convenient specimen collection. Same-day & next-day availability.',
  openGraph: {
    title: 'In-Home Blood Draw Los Angeles CA',
    description: 'Professional blood draws in the comfort of your Los Angeles home. Same-day & next-day service available.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
