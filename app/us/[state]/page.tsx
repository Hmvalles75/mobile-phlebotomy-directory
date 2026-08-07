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

/**
 * State-level FAQPage. The 17 generated city pages carry FAQ schema but state
 * pages only had CollectionPage/ItemList/BreadcrumbList, so /us/california and
 * /us/washington were competing for the same questions without being eligible
 * for the FAQ rich result.
 *
 * Wording is lifted from scripts/upgrade-city-page.ts rather than newly
 * written, so the same claims appear site-wide and nothing here asserts a
 * price or coverage fact the city pages don't already make. Deliberately no
 * provider count: state counts move constantly and this template is rendered
 * per request, unlike the frozen city pages.
 */
function buildStateFaqSchema(stateName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does mobile phlebotomy cost in ${stateName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Mobile phlebotomy in ${stateName} typically starts around $75 per visit for the phlebotomist's service fee, varying by metro area and urgency. Independent providers usually charge less than national services like Quest Mobile ($79) or NPPN ($99). Lab processing fees are billed separately by your lab. Medicare and Medicaid patients in ${stateName} typically pay $0–$25 when the draw is medically necessary and ordered by a physician.`,
        },
      },
      {
        '@type': 'Question',
        name: `How fast can I get a mobile phlebotomist in ${stateName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Most ${stateName} providers offer same-day or next-day appointments, especially for morning routine draws. STAT (urgent) draws are typically available within 2–4 hours for an added fee. Weekend and evening appointments are available from many independent providers. Availability varies by city — check the city pages below for providers serving your area.`,
        },
      },
      {
        '@type': 'Question',
        name: `Do mobile phlebotomists in ${stateName} accept insurance?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Many mobile phlebotomists in ${stateName} accept insurance, including Medicare Part B for homebound patients (typical copay $0–$25), state Medicaid programs, and major private insurance plans (often with pre-authorization). Independent providers usually also accept HSA, FSA, and competitive self-pay rates. Confirm insurance acceptance directly with the provider before booking.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which labs do ${stateName} mobile phlebotomists work with?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Most ${stateName} mobile phlebotomists routinely drop off specimens at LabCorp and Quest Diagnostics patient service centers. Many also deliver to hospital-affiliated labs and specialty labs when your physician's order specifies a particular lab. Confirm your provider can route to your preferred lab before booking.`,
        },
      },
    ],
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
  const faqSchema = buildStateFaqSchema(stateInfo.name)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <StatePageClient stateSlug={stateSlug} />
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 pb-12">
          <CitiesInState cities={cities} stateSlug={stateSlug} stateName={stateInfo.name} />
        </div>
      </div>
    </>
  )
}
