import Link from 'next/link'
import type { ProviderLink } from '@/lib/seo/internalLinks'

interface Props {
  providers: ProviderLink[]
  cityName: string
  stateAbbr: string
}

export default function ProvidersInCity({ providers, cityName, stateAbbr }: Props) {
  // Returning null here left Class C cities (a matching city page, no matching
  // providers) with no server-rendered section at all — Pittsburgh shipped ~350
  // fewer characters than Columbus for that reason alone. An empty state is
  // thin, but it is real content and it tells the reader something true, which
  // an absent section does not.
  if (providers.length === 0) {
    return (
      <section className="mt-12 bg-white rounded-lg shadow-md p-8" aria-labelledby="providers-in-city-heading">
        <h2 id="providers-in-city-heading" className="text-2xl font-bold text-gray-900 mb-4">
          Mobile phlebotomists serving {cityName}
        </h2>
        <p className="text-gray-600 mb-3">
          We don&apos;t yet have a provider listed with {cityName}, {stateAbbr} as their home base.
          Providers based in nearby cities often travel here — the nearby cities below are the
          quickest way to find one.
        </p>
        <p className="text-gray-600">
          If you provide mobile phlebotomy in {cityName},{' '}
          <a href="/add-provider" className="text-primary-700 font-medium hover:underline">
            add your listing
          </a>{' '}
          and patients searching {cityName} will find you.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-12 bg-white rounded-lg shadow-md p-8" aria-labelledby="providers-in-city-heading">
      <h2 id="providers-in-city-heading" className="text-2xl font-bold text-gray-900 mb-6">
        Mobile phlebotomists in {cityName}
      </h2>
      <p className="text-gray-600 mb-6">
        Verified providers serving {cityName}, {stateAbbr} and the surrounding area.
      </p>
      <nav aria-label={`Mobile phlebotomy providers in ${cityName}`}>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const summary = (p.description || '')
              .replace(/\*\*/g, '')
              .split(/\n+/)[0]
              .trim()
              .slice(0, 140)
            return (
              <li key={p.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <Link
                  href={`/provider/${p.slug}`}
                  className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                >
                  {p.name}
                </Link>
                {p.primaryCity && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {p.primaryCity}{p.primaryState ? `, ${p.primaryState}` : ''}
                  </div>
                )}
                {summary && (
                  <p className="text-sm text-gray-600 mt-2 leading-snug">{summary}</p>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </section>
  )
}
