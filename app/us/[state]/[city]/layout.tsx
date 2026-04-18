import { Metadata } from 'next'
import { CITY_MAPPING } from '@/data/cities-full'

interface CityLayoutProps {
  children: React.ReactNode
  params: {
    state: string
    city: string
  }
}

export async function generateMetadata({ params }: { params: { state: string, city: string } }): Promise<Metadata> {
  const cityKey = params.city.toLowerCase().replace(/-/g, '')
  const cityInfo = CITY_MAPPING[cityKey]

  // For cities not in mapping, create conversion-optimized SEO
  if (!cityInfo) {
    const cityName = params.city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const state = params.state.toUpperCase()

    const title = `Mobile Phlebotomy ${cityName}, ${state} | Find At-Home Blood Draw Services`
    const description = `Looking for mobile blood draw in ${cityName}? Submit your request and we'll connect you with licensed phlebotomists serving ${state}. Free, fast, no obligation.`

    return {
      title,
      description,
      keywords: `mobile phlebotomy ${cityName}, at-home blood draw ${cityName} ${state}, phlebotomist ${cityName}, mobile lab services ${state}`,
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

  const title = `Mobile Phlebotomy ${cityInfo.name} | At-Home Blood Draw Near You (2026)`
  const description = `Licensed mobile phlebotomists serving ${cityInfo.name}, ${cityInfo.state} and surrounding areas. At-home blood draws \u2014 same-day and next-day available.`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${cityInfo.name}, at-home blood draw ${cityInfo.name} ${cityInfo.state}, phlebotomist ${cityInfo.name}, mobile lab ${cityInfo.name}, home blood test ${cityInfo.name}`,
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

export default function CityLayout({ children }: CityLayoutProps) {
  return children
}
