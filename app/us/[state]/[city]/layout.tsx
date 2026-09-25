import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { cityByStateCity } from '@/data/cities-full'
import { STATE_DATA, ABBR_TO_SLUG } from '@/data/states-full'
import { getProvidersForCity, getNearbyCities } from '@/lib/seo/internalLinks'
import ProvidersInCity from '@/components/seo/ProvidersInCity'
import NearbyCities from '@/components/seo/NearbyCities'
import { CITY_LONGFORM } from '@/data/city-longform'
import { buildCityMetadata } from '@/lib/seo/locationMeta'

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
  const cityInfo = cityByStateCity(stateSlug, citySlug)
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
  // Self-canonical with a live provider count; one builder shared with the 18
  // static overrides (lib/seo/locationMeta.ts). Unmapped cities 308 below.
  const { stateSlug, citySlug } = resolveCityState(params.state, params.city)
  return buildCityMetadata(stateSlug, citySlug)
}

// Layout is a server component, so the link sections it renders below
// the client `page.tsx` end up in the initial HTML — visible to Googlebot
// without JS. The client page above stays untouched (its provider grid
// still hydrates), but Google now sees a populated link graph regardless
// of whether the client island fetches successfully.
export default async function CityLayout({ children, params }: CityLayoutProps) {
  const { citySlug, cityName, stateAbbr, stateName, stateSlug, cityInfo } = resolveCityState(params.state, params.city)

  // URL consolidation batch 2 (2026-09-24). This route used to render ANY
  // /us/{anything}/{anything} as a real page with a self-canonical: an
  // unbounded duplicate surface, fed by 800 provider breadcrumbs pointing at
  // ~180 cities that were never in CITY_MAPPING. Unknown state: 404. Known
  // state, unmapped city: 308 to the state page, which links every active
  // provider in the state. Cities with providers get mapped instead (see
  // scripts/list-unmapped-provider-cities.ts).
  if (!cityInfo) {
    if (!STATE_DATA[stateSlug]) notFound()
    permanentRedirect(`/us/${stateSlug}`)
  }
  // Long-form local copy ported from a legacy page before its 308. The 18
  // static override pages render their own copy of this and never reach this
  // layout, so nothing is shown twice.
  const longform = CITY_LONGFORM[`${stateSlug}/${citySlug}`]

  const [providers, nearbyCities] = await Promise.all([
    getProvidersForCity(citySlug, stateAbbr),
    getNearbyCities(citySlug, stateAbbr, 8),
  ])

  return (
    <>
      {children}
      {longform && (
        <section className="container mx-auto px-4 pt-8 max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile Phlebotomy in {cityName}: A Local Guide</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            {longform.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>
      )}
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
