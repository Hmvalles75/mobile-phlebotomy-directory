import Link from 'next/link'
import { CITY_MAPPING } from '@/data/cities-full'
import { ABBR_TO_SLUG, STATE_DATA } from '@/data/states-full'
import { cityAnchorVariants, pickAnchorVariant, cityLinkExists } from '@/lib/seo/anchorHelpers'
import type { CityLink } from '@/lib/seo/anchorHelpers'

interface Props {
  providerSlug: string
  primaryCity: string | null
  primaryCitySlug: string | null
  stateAbbr: string | null
  // Optional pre-resolved neighbor cities. If absent, derives from CITY_MAPPING.
  neighborCities?: CityLink[]
}

function defaultNeighbors(stateAbbr: string, excludeCitySlug: string | null, limit = 3): CityLink[] {
  const stateSlug = ABBR_TO_SLUG[stateAbbr]
  if (!stateSlug) return []
  const out: CityLink[] = []
  for (const [slug, info] of Object.entries(CITY_MAPPING)) {
    if (info.state !== stateAbbr) continue
    if (slug === excludeCitySlug) continue
    out.push({ slug, name: info.name, stateAbbr: info.state, stateSlug })
    if (out.length >= limit) break
  }
  return out
}

export default function ServiceAreaLinks({
  providerSlug,
  primaryCity,
  primaryCitySlug,
  stateAbbr,
  neighborCities,
}: Props) {
  if (!stateAbbr) return null
  const stateSlug = ABBR_TO_SLUG[stateAbbr]
  const stateInfo = stateSlug ? STATE_DATA[stateSlug] : null
  if (!stateInfo) return null

  const cityHasPage = primaryCitySlug ? cityLinkExists(primaryCitySlug) : false
  const neighbors = neighborCities ?? defaultNeighbors(stateAbbr, primaryCitySlug, 3)

  const cityAnchor = primaryCity && primaryCitySlug && cityHasPage
    ? pickAnchorVariant(
        `provider-${providerSlug}->${primaryCitySlug}`,
        cityAnchorVariants(primaryCity, stateAbbr)
      )
    : null

  return (
    <section className="mt-8 bg-white rounded-lg shadow-md p-6" aria-labelledby="service-area-links-heading">
      <h2 id="service-area-links-heading" className="text-xl font-bold text-gray-900 mb-4">
        Explore the service area
      </h2>
      <nav aria-label="Service area pages">
        <ul className="space-y-2">
          {cityAnchor && primaryCitySlug && (
            <li>
              <Link
                href={`/us/${stateSlug}/${primaryCitySlug}`}
                className="text-primary-700 hover:text-primary-800 hover:underline font-medium"
              >
                {cityAnchor}
              </Link>
            </li>
          )}
          <li>
            <Link
              href={`/us/${stateSlug}`}
              className="text-primary-700 hover:text-primary-800 hover:underline font-medium"
            >
              All mobile phlebotomy providers in {stateInfo.name}
            </Link>
          </li>
          {neighbors.map((c) => {
            const anchor = pickAnchorVariant(
              `provider-${providerSlug}->${c.slug}`,
              cityAnchorVariants(c.name, c.stateAbbr)
            )
            return (
              <li key={c.slug}>
                <Link
                  href={`/us/${c.stateSlug}/${c.slug}`}
                  className="text-primary-700 hover:text-primary-800 hover:underline"
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
