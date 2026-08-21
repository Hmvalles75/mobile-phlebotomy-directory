import { cityByStateCity } from '@/data/cities-full'
import { getProvidersByCity } from '@/lib/providers-city'
import CityPageClient from './CityPageClient'

/**
 * Server shell for the city page.
 *
 * The provider listing used to be fetched in a useEffect inside the client
 * component below. Googlebot executes no JavaScript, so it received the
 * component's pre-fetch state: no listings, and a heading reading
 * "0 Providers Available in {City}" — a directory page announcing that the
 * directory was empty. Fetching here puts the real listing in the HTML.
 *
 * The client component keeps the search and service filters, which genuinely
 * need to be interactive; it just no longer owns the data.
 */
interface PageProps {
  params: { state: string; city: string }
}

export default async function CityPage({ params }: PageProps) {
  const cityInfo = cityByStateCity(params.state, params.city)

  // Mirrors the fallback the client component already applied for cities that
  // aren't in CITY_MAPPING, so an unmapped slug still renders a real page.
  const cityName = cityInfo?.name
    || params.city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const stateAbbr = cityInfo?.state || params.state.toUpperCase()

  // Unmapped cities previously short-circuited to an empty list; keep that.
  const grouped = cityInfo
    ? await getProvidersByCity(cityName, stateAbbr)
    : { local: [], regional: [] }

  // Local first, then the providers who only travel here. The client keeps them
  // in separate sections; this flat list is what search and filtering run over.
  const providers = [...grouped.local, ...grouped.regional]

  return (
    <CityPageClient
      params={params}
      initialProviders={providers as any}
      initialGrouped={grouped as any}
    />
  )
}
