import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blood Draw at Home Livonia MI | Mobile Phlebotomy Services (2026)',
  description: 'Get a blood draw at home in Livonia, MI. Certified mobile phlebotomists serving Livonia and surrounding areas.',
  openGraph: {
    title: 'Blood Draw at Home Livonia MI',
    description: 'Get a blood draw at home in Livonia, MI. Certified mobile phlebotomists serving Livonia and surrounding areas.',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
