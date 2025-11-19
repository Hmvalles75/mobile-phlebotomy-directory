import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StatePageClient, { stateData } from './StatePageClient'
import { SITE_URL } from '@/lib/seo'

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
    title: `Mobile Phlebotomy in ${stateName} – At-Home Blood Draw Services | MobilePhlebotomy.org`,
    description: `Find certified mobile phlebotomists for at-home blood draws throughout ${stateName}. Browse local providers and request a mobile blood draw in your area.`,
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
      title: `Mobile Phlebotomy in ${stateName} – At-Home Blood Draw Services`,
      description: `Find certified mobile phlebotomists for at-home blood draws throughout ${stateName}. Browse local providers and request a mobile blood draw in your area.`,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Mobile Phlebotomy in ${stateName} – At-Home Blood Draw Services`,
      description: `Find certified mobile phlebotomists for at-home blood draws throughout ${stateName}. Browse local providers and request a mobile blood draw in your area.`,
    },
  }
}

export default function StatePage({ params }: Props) {
  const stateSlug = params.state

  if (!stateData[stateSlug]) {
    notFound()
  }

  return <StatePageClient stateSlug={stateSlug} />
}
