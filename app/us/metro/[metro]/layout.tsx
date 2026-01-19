import { Metadata } from 'next'
import { getMetroBySlug } from '@/data/top-metros'

interface MetroLayoutProps {
  children: React.ReactNode
  params: {
    metro: string
  }
}

export async function generateMetadata({ params }: { params: { metro: string } }): Promise<Metadata> {
  const metro = getMetroBySlug(params.metro)

  if (!metro) {
    return {
      title: 'Metro Area Not Found',
      description: 'The requested metro area was not found.'
    }
  }

  const title = `Mobile Phlebotomy ${metro.city}, ${metro.stateAbbr} | Best At-Home Blood Draw (2026)`
  const description = `Find top-rated mobile phlebotomists in ${metro.city}, ${metro.state}! Same-day service available. Insurance accepted. Book online today.`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${metro.city}, at-home blood draw ${metro.city}, phlebotomist ${metro.city} ${metro.stateAbbr}, mobile lab services ${metro.city}, home blood test ${metro.city}`,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
  }
}

export default function MetroLayout({ children }: MetroLayoutProps) {
  return children
}