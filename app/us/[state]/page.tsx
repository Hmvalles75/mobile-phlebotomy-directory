import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StatePageClient from './StatePageClient'
import { SITE_URL } from '@/lib/seo'
import { STATE_DATA as stateData } from '@/data/states-full'
import { getCitiesInState } from '@/lib/seo/internalLinks'
import CitiesInState from '@/components/seo/CitiesInState'

type Props = {
  params: { state: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateSlug = params.state
  const stateInfo = stateData[stateSlug]

  if (!stateInfo) {
    return {}
  }

  const stateName = stateInfo.name
  const url = `${SITE_URL}/us/${stateSlug}`

  return {
    title: `Mobile Phlebotomy in ${stateName} | At-Home Blood Draw Services (2026)`,
    description: `Find licensed mobile phlebotomists across ${stateName}. At-home blood draws by certified providers. Request service in your area today.`,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: `Mobile Phlebotomy in ${stateName} | At-Home Blood Draw Services (2026)`,
      description: `Find licensed mobile phlebotomists across ${stateName}. At-home blood draws by certified providers. Request service in your area today.`,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Mobile Phlebotomy in ${stateName} | At-Home Blood Draw Services (2026)`,
      description: `Find licensed mobile phlebotomists across ${stateName}. At-home blood draws by certified providers. Request service in your area today.`,
    },
  }
}

export default async function StatePage({ params }: Props) {
  const stateSlug = params.state
  const stateInfo = stateData[stateSlug]

  if (!stateInfo) {
    notFound()
  }

  // Server-rendered city directory — visible in initial HTML to Googlebot
  // even though StatePageClient hydrates its provider grid client-side.
  const cities = await getCitiesInState(stateInfo.abbr)

  return (
    <>
      <StatePageClient stateSlug={stateSlug} />
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 pb-12">
          <CitiesInState cities={cities} stateSlug={stateSlug} stateName={stateInfo.name} />
        </div>
      </div>
    </>
  )
}
