import Link from 'next/link'
import type { ProviderLink } from '@/lib/seo/internalLinks'

interface Props {
  providers: ProviderLink[]
  cityName: string | null
}

export default function NearbyProviders({ providers, cityName }: Props) {
  if (providers.length === 0) return null

  return (
    <section className="mt-8 bg-white rounded-lg shadow-md p-6" aria-labelledby="nearby-providers-heading">
      <h2 id="nearby-providers-heading" className="text-xl font-bold text-gray-900 mb-4">
        Other mobile phlebotomists{cityName ? ` near ${cityName}` : ''}
      </h2>
      <nav aria-label="Other nearby providers">
        <ul className="space-y-3">
          {providers.map((p) => (
            <li key={p.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
              <Link
                href={`/provider/${p.slug}`}
                className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
              >
                {p.name}
              </Link>
              {p.primaryCity && (
                <span className="text-sm text-gray-500 ml-2">
                  — {p.primaryCity}{p.primaryState ? `, ${p.primaryState}` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
