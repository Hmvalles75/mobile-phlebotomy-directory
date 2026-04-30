import Link from 'next/link'
import type { ProviderLink } from '@/lib/seo/internalLinks'

interface Props {
  providers: ProviderLink[]
  cityName: string
  stateAbbr: string
}

export default function ProvidersInCity({ providers, cityName, stateAbbr }: Props) {
  if (providers.length === 0) return null

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
