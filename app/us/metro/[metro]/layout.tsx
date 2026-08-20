import { Metadata } from 'next'
import { getMetroBySlug } from '@/data/top-metros'
import { SITE_URL } from '@/lib/seo'
import { metroHref } from '@/lib/seo/metroCanonical'
import { getProvidersForCity, getNearbyCities } from '@/lib/seo/internalLinks'
import ProvidersInCity from '@/components/seo/ProvidersInCity'
import NearbyCities from '@/components/seo/NearbyCities'

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

  const title = `Mobile Phlebotomy ${metro.city}, ${metro.stateAbbr} | At-Home Blood Draw Services (2026)`
  const description = `Find certified mobile phlebotomists serving ${metro.city} and surrounding areas. At-home blood draws with same-day availability.`

  // Cross-canonical to the city page rather than self-canonical. These pages
  // previously inherited the root `canonical: '/'` and disclaimed themselves to
  // the homepage. Pointing at the city page consolidates the 46 metros that
  // have a twin immediately, without waiting for each redirect batch to ship —
  // metroHref returns the metro's own URL for New York City and Washington DC,
  // which have no city page, so those stay self-canonical.
  const canonical = `${SITE_URL}${metroHref(metro)}`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${metro.city}, at-home blood draw ${metro.city}, phlebotomist ${metro.city} ${metro.stateAbbr}, mobile lab services ${metro.city}, home blood test ${metro.city}`,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
  }
}

/**
 * Metro pages carried no server-rendered provider content at all — this layout
 * was `return children`, and the page above it is a client component whose
 * listing arrives only after hydration. Googlebot received a metro page with
 * zero provider links and a heading reading "0 Providers in {City}".
 *
 * Rendering the same section the city layout uses brings all three page classes
 * to parity. Metro slugs map to a city for the lookup: 44 of the 50 metros have
 * a city twin they already cross-canonicalise to, and the two that don't
 * (New York City, Washington DC) still resolve by city name.
 */
export default async function MetroLayout({ children, params }: MetroLayoutProps) {
  const metro = getMetroBySlug(params.metro)

  if (!metro) return <>{children}</>

  const citySlug = metro.city.toLowerCase().trim().replace(/\s+/g, '-')
  const [providers, nearbyCities] = await Promise.all([
    getProvidersForCity(citySlug, metro.stateAbbr),
    getNearbyCities(citySlug, metro.stateAbbr, 8),
  ])

  return (
    <>
      {children}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 pb-12">
          <ProvidersInCity providers={providers} cityName={metro.city} stateAbbr={metro.stateAbbr} />
          <NearbyCities
            cities={nearbyCities}
            sourceCitySlug={citySlug}
            sourceCityName={metro.city}
            sourceStateName={metro.state}
          />
        </div>
      </div>
    </>
  )
}