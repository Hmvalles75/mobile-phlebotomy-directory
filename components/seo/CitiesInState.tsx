import Link from 'next/link'
import type { CityLink } from '@/lib/seo/anchorHelpers'
import { cityAnchorVariants, pickAnchorVariant } from '@/lib/seo/anchorHelpers'

interface Props {
  cities: CityLink[]
  stateSlug: string
  stateName: string
}

export default function CitiesInState({ cities, stateSlug, stateName }: Props) {
  if (cities.length === 0) return null

  return (
    <section className="mt-8 bg-white rounded-lg shadow-md p-8" aria-labelledby="cities-in-state-heading">
      <h2 id="cities-in-state-heading" className="text-2xl font-bold text-gray-900 mb-4">
        Cities we serve in {stateName}
      </h2>
      <p className="text-gray-600 mb-6">
        Browse mobile phlebotomy providers by city across {stateName}.
      </p>
      <nav aria-label={`Cities in ${stateName} with mobile phlebotomy providers`}>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cities.map((c) => {
            const anchor = pickAnchorVariant(
              `state-${stateSlug}->${c.slug}`,
              cityAnchorVariants(c.name, c.stateAbbr)
            )
            return (
              <li key={c.slug}>
                <Link
                  href={`/us/${c.stateSlug}/${c.slug}`}
                  className="block px-4 py-3 bg-gray-50 hover:bg-primary-50 rounded-lg text-sm text-gray-900 hover:text-primary-700 transition-colors"
                >
                  {anchor}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </section>
  )
}
