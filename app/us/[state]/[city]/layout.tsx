import { Metadata } from 'next'
import { CITY_MAPPING } from '@/data/cities-full'
import { STATE_DATA, ABBR_TO_SLUG } from '@/data/states-full'
import { getProvidersForCity, getNearbyCities } from '@/lib/seo/internalLinks'
import ProvidersInCity from '@/components/seo/ProvidersInCity'
import NearbyCities from '@/components/seo/NearbyCities'

interface CityLayoutProps {
  children: React.ReactNode
  params: {
    state: string
    city: string
  }
}

// Resolve the city + state info shared between metadata and layout body.
function resolveCityState(stateSlug: string, citySlugRaw: string) {
  const citySlug = citySlugRaw.toLowerCase()
  const cityInfo = CITY_MAPPING[citySlug]
  const fallbackName = citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const cityName = cityInfo?.name || fallbackName
  const stateAbbr = (cityInfo?.state || stateSlug.toUpperCase()).toUpperCase()
  // Resolve state slug+name. Prefer the slug Next.js gave us if it's
  // already valid; fall back to deriving from the abbr.
  const stateSlugCanonical = STATE_DATA[stateSlug] ? stateSlug : ABBR_TO_SLUG[stateAbbr] || stateSlug
  const stateName = STATE_DATA[stateSlugCanonical]?.name || stateAbbr
  return { citySlug, cityName, stateAbbr, stateSlug: stateSlugCanonical, stateName, cityInfo }
}

export async function generateMetadata({ params }: { params: { state: string, city: string } }): Promise<Metadata> {
  const { citySlug, cityName, stateAbbr, cityInfo } = resolveCityState(params.state, params.city)

  // For cities not in mapping, create conversion-optimized SEO
  if (!cityInfo) {
    const title = `Mobile Phlebotomy ${cityName}, ${stateAbbr} | Find At-Home Blood Draw Services`
    const description = `Looking for mobile blood draw in ${cityName}? Submit your request and we'll connect you with licensed phlebotomists serving ${stateAbbr}. Free, fast, no obligation.`

    return {
      title,
      description,
      keywords: `mobile phlebotomy ${cityName}, at-home blood draw ${cityName} ${stateAbbr}, phlebotomist ${cityName}, mobile lab services ${stateAbbr}`,
      openGraph: { title, description, type: 'website' },
      twitter: { title, description, card: 'summary_large_image' },
    }
  }

  const title = `Mobile Phlebotomy ${cityInfo.name} | At-Home Blood Draw Near You (2026)`
  const description = `Licensed mobile phlebotomists serving ${cityInfo.name}, ${cityInfo.state} and surrounding areas. At-home blood draws — same-day and next-day available.`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${cityInfo.name}, at-home blood draw ${cityInfo.name} ${cityInfo.state}, phlebotomist ${cityInfo.name}, mobile lab ${cityInfo.name}, home blood test ${cityInfo.name}`,
    openGraph: { title, description, type: 'website' },
    twitter: { title, description, card: 'summary_large_image' },
  }
}

// Layout is a server component, so the link sections it renders below
// the client `page.tsx` end up in the initial HTML — visible to Googlebot
// without JS. The client page above stays untouched (its provider grid
// still hydrates), but Google now sees a populated link graph regardless
// of whether the client island fetches successfully.
export default async function CityLayout({ children, params }: CityLayoutProps) {
  const { citySlug, cityName, stateAbbr, stateName } = resolveCityState(params.state, params.city)

  const [providers, nearbyCities] = await Promise.all([
    getProvidersForCity(citySlug, stateAbbr),
    getNearbyCities(citySlug, stateAbbr, 8),
  ])

  return (
    <>
      {children}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 pb-12">
          <ProvidersInCity providers={providers} cityName={cityName} stateAbbr={stateAbbr} />
          <NearbyCities
            cities={nearbyCities}
            sourceCitySlug={citySlug}
            sourceCityName={cityName}
            sourceStateName={stateName}
          />
        </div>
      </div>
    </>
  )
}
