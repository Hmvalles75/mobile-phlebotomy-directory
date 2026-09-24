import Link from 'next/link'
import type { ProviderLink } from '@/lib/seo/internalLinks'

interface Props {
  providers: ProviderLink[]
  stateName: string
  stateAbbr: string
}

/**
 * Server-rendered list of every active provider in the state, grouped by
 * city. This is the crawlable counterpart of the client-side grid above it:
 * the grid hydrates after fetch and is not in the initial HTML, so before
 * 2026-09-24 a provider in an unmapped city had no listing page linking to it
 * at all. One link per provider, cities in alphabetical order, featured first
 * within a city.
 */
export default function ProvidersInState({ providers, stateName, stateAbbr }: Props) {
  if (providers.length === 0) return null

  const byCity = new Map<string, ProviderLink[]>()
  for (const p of providers) {
    const city = (p.primaryCity || '').trim() || 'Statewide'
    if (!byCity.has(city)) byCity.set(city, [])
    byCity.get(city)!.push(p)
  }
  const cities = [...byCity.keys()].sort((a, b) => (a === 'Statewide' ? 1 : b === 'Statewide' ? -1 : a.localeCompare(b)))

  return (
    <section className="mt-12 bg-white rounded-lg shadow-md p-8" aria-labelledby="providers-in-state-heading">
      <h2 id="providers-in-state-heading" className="text-2xl font-bold text-gray-900 mb-2">
        All mobile phlebotomists listed in {stateName}
      </h2>
      <p className="text-gray-600 mb-6">
        {providers.length} provider{providers.length === 1 ? '' : 's'} across {cities.length} {cities.length === 1 ? 'city' : 'cities'} in {stateAbbr}. Most travel well beyond their home city.
      </p>
      <nav aria-label={`All mobile phlebotomy providers in ${stateName}`}>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8">
          {cities.map((city) => (
            <div key={city} className="break-inside-avoid mb-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{city}</h3>
              <ul className="space-y-1">
                {byCity.get(city)!.map((p) => (
                  <li key={p.id}>
                    <Link href={`/provider/${p.slug}`} className="text-primary-700 hover:text-primary-800 hover:underline">
                      {p.name.trim()}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </section>
  )
}
