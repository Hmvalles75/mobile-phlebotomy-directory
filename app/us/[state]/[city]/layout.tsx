import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/seo'
import { cityByStateCity } from '@/data/cities-full'
import { STATE_DATA, ABBR_TO_SLUG } from '@/data/states-full'
import { getProvidersForCity, getNearbyCities } from '@/lib/seo/internalLinks'
import ProvidersInCity from '@/components/seo/ProvidersInCity'
import NearbyCities from '@/components/seo/NearbyCities'
import { CITY_LONGFORM } from '@/data/city-longform'

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
  const { citySlug, cityName, stateAbbr, stateSlug, cityInfo } = resolveCityState(params.state, params.city)

  // Self-canonical. Without this the page inherits app/layout.tsx's
  // `alternates: { canonical: '/' }` and every dynamic city page tells Google
  // it is a duplicate of the homepage — 512 of the 530 city pages were doing
  // exactly that, which is why legacy /{city}-{st}/ URLs outranked their /us/
  // twins in nearly every pair: the legacy pages self-canonicalise correctly
  // and these disclaimed themselves. The 18 generated static overrides set
  // their own canonical and take precedence over this route entirely.
  const canonical = `${SITE_URL}/us/${stateSlug}/${citySlug}`

  // CTR-optimized 2026-04-30. Old title format was generic and was getting
  // 0.27-0.9% CTR on high-impression city pages (Seattle 4,114 imp at
  // page-1 position 6.76 with only 0.27% CTR — the strongest signal that
  // the snippet wasn't compelling). New format leads with city + price
  // anchor since users searching "mobile phlebotomy [city]" want concrete
  // info up front. Description tightens parallel.

  // Unmapped cities no longer render (the layout below 308s them to the state
  // page, or 404s an unknown state), so there is no metadata to build.
  if (!cityInfo) return {}

  const title = `Mobile Phlebotomy ${cityInfo.name}, ${cityInfo.state}: At-Home Blood Draws From $75`
  const description = `${cityInfo.name} mobile phlebotomy: licensed providers, same-day & next-day at-home blood draws starting at $75 per visit. Medicare-friendly. Book a draw today.`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${cityInfo.name}, at-home blood draw ${cityInfo.name} ${cityInfo.state}, phlebotomist ${cityInfo.name}, mobile lab ${cityInfo.name}, home blood test ${cityInfo.name}`,
    alternates: { canonical },
    // noProviders cities were only ever kept out of the sitemap; they still
    // indexed as thin self-canonical pages. Keep the URL, drop it from the
    // index until a provider lands there (2026-09-24).
    ...(cityInfo.noProviders ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { title, description, card: 'summary_large_image' },
  }
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
