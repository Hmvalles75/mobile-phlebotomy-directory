import Link from 'next/link'
import type { CityLink } from '@/lib/seo/anchorHelpers'
import { cityAnchorVariants, pickAnchorVariant } from '@/lib/seo/anchorHelpers'

interface Props {
  cities: CityLink[]
  sourceCitySlug: string
  sourceCityName: string
  sourceStateName: string
}

export default function NearbyCities({ cities, sourceCitySlug, sourceCityName, sourceStateName }: Props) {
  if (cities.length === 0) return null

  return (
    <section className="mt-12 bg-white rounded-lg shadow-md p-8" aria-labelledby="nearby-cities-heading">
      <h2 id="nearby-cities-heading" className="text-2xl font-bold text-gray-900 mb-6">
        Nearby cities in {sourceStateName}
      </h2>
      <p className="text-gray-600 mb-6">
        Looking outside {sourceCityName}? Browse mobile phlebotomy providers in nearby {sourceStateName} cities.
      </p>
      <nav aria-label={`Other cities in ${sourceStateName}`}>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cities.map((c) => {
            // Anchor varies by source page slug — same destination gets a
            // different anchor depending on which page is linking to it,
            // so the inbound link pattern doesn't read as templated to Google.
            const anchor = pickAnchorVariant(
              `${sourceCitySlug}->${c.slug}`,
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
