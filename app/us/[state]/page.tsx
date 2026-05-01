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

  // CTR-optimized 2026-04-30. Old title was generic ("Mobile Phlebotomy
  // in X | At-Home Blood Draw Services (2026)") and page-2 ranked state
  // pages were getting 0.3-0.9% CTR despite high impressions (TX 5,484,
  // CA 3,319, FL 2,785). New title leads with a price anchor — concrete
  // numbers in SERPs lift CTR significantly over generic value props.
  // Description leads with state name + price/availability instead of
  // "Find licensed mobile phlebotomists" preamble.
  const title = `Mobile Phlebotomy in ${stateName}: At-Home Blood Draws From $75 (2026)`
  const description = `${stateName} mobile phlebotomy: licensed providers, same-day & next-day at-home blood draws starting at $75 per visit. Medicare-friendly. Request a draw today.`

  return {
    title,
    description,
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
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
