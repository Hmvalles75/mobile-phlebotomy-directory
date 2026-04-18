import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact MobilePhlebotomy.org | Support for Patients & Providers',
  description: 'Get in touch with MobilePhlebotomy.org. Patient support, provider signup questions, and partnership inquiries. Email us at hector@mobilephlebotomy.org.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact MobilePhlebotomy.org',
    description: 'Patient support, provider questions, and partnership inquiries.',
    type: 'website',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
