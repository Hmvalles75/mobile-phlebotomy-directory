import Link from 'next/link'
import type { CityLink } from '@/lib/seo/anchorHelpers'
import { ABBR_TO_SLUG, STATE_DATA } from '@/data/states-full'
import { cityAnchorVariants, pickAnchorVariant } from '@/lib/seo/anchorHelpers'

interface Props {
  providerSlug: string
  cities: CityLink[]
  zipCodes: string[]
  stateAbbr: string | null
}

// Premium-page replacement for NearbyProviders. Lists every city the
// provider covers as an internal link, plus their ZIP coverage. Outward
// linking only — no competitor exposure.
export default function ServiceAreasCovered({ providerSlug, cities, zipCodes, stateAbbr }: Props) {
  const stateSlug = stateAbbr ? ABBR_TO_SLUG[stateAbbr] : null
  const stateInfo = stateSlug ? STATE_DATA[stateSlug] : null
  if (cities.length === 0 && zipCodes.length === 0 && !stateInfo) return null

  return (
    <section className="py-16 md:py-20 bg-white border-t border-gray-100" aria-labelledby="service-areas-covered-heading">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <div className="text-sm font-bold text-teal-600 tracking-wider uppercase mb-3">Service Areas</div>
          <h2 id="service-areas-covered-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Cities and ZIP codes we cover
          </h2>
          {stateInfo && (
            <p className="text-lg text-gray-600">
              Serving locations across {stateInfo.name} and the surrounding region.
            </p>
          )}
        </div>

        {cities.length > 0 && (
          <nav aria-label="Cities covered" className="mb-10">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Cities</h3>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map((c) => {
                const anchor = pickAnchorVariant(
                  `premium-${providerSlug}->${c.slug}`,
                  cityAnchorVariants(c.name, c.stateAbbr)
                )
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/us/${c.stateSlug}/${c.slug}`}
                      className="block px-4 py-3 bg-teal-50 hover:bg-teal-100 rounded-lg text-sm text-gray-900 hover:text-teal-800 transition-colors border border-teal-100"
                    >
                      {anchor}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {stateInfo && stateSlug && (
          <div className="mb-10 text-center">
            <Link
              href={`/us/${stateSlug}`}
              className="inline-flex items-center text-teal-700 hover:text-teal-800 font-semibold hover:underline"
            >
              View all mobile phlebotomy providers in {stateInfo.name} →
            </Link>
          </div>
        )}

        {zipCodes.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">ZIP code coverage</h3>
            <div className="flex flex-wrap gap-2">
              {zipCodes.map((zip) => (
                <span
                  key={zip}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-mono shadow-sm"
                >
                  {zip}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
