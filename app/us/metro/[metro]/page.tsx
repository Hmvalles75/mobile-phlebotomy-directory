import { notFound } from 'next/navigation'
import { getMetroBySlug } from '@/data/top-metros'
import { getProvidersByCity } from '@/lib/providers-city'
import MetroPageClient from './MetroPageClient'

/**
 * Server shell for the metro page.
 *
 * The provider list used to be fetched in a useEffect inside the client
 * component below. Googlebot executes no JavaScript, so it received the
 * component's pre-fetch state — an empty array — and every metro page shipped a
 * description reading "Find 0 certified mobile phlebotomy providers in {City}",
 * with the JSON-LD serviceProvider array empty to match. Miami advertised zero
 * while its city page listed twelve.
 *
 * This is the same defect fixed on /us/[state]/[city] in 9471def, and the same
 * fix: fetch here so the real list is in the HTML. The metro tier was left out
 * of that change because it was already canonically correct — 48 of 50 metros
 * cross-canonical to their city page — but canonical correctness and rendering
 * correctness are different problems, and only the first had been addressed.
 * The two self-canonical metros, new-york-city and washington-dc, are the ones
 * that were indexed on their own merits while claiming zero coverage.
 *
 * Canonical behaviour is untouched: it lives in layout.tsx via metroHref().
 */
interface PageProps {
  params: { metro: string }
}

export default async function MetroPage({ params }: PageProps) {
  const metro = getMetroBySlug(params.metro)

  if (!metro) {
    notFound()
  }

  // One metro name does not resolve against the bundled ZIP dataset: the record
  // for new-york-city carries city "New York City", which has no entry — the
  // city is "New York". Checked all 50; it is the only one. Aliasing here rather
  // than in lib/cityGeography.ts keeps the geography module untouched, and this
  // is a property of the metro data, not of how matching works.
  //
  // It matters more than one row suggests: new-york-city is one of only two
  // self-canonical metros, so it is indexed on its own merits — and it was the
  // page still claiming zero coverage.
  const CITY_NAME_ALIASES: Record<string, string> = {
    'New York City': 'New York',
  }
  const lookupCity = CITY_NAME_ALIASES[metro.city] || metro.city

  const { local, regional } = await getProvidersByCity(lookupCity, metro.stateAbbr)

  // The client renders from the legacy citySpecific/regional/statewide shape,
  // the same aliasing /api/providers/city already does for the ~100 legacy P3
  // pages. Passing it here keeps this change to the data source and leaves the
  // component's rendering logic alone. `statewide` has always been empty in
  // practice — it was fed by is_nationwide, a field the database never
  // populated — and is returned only so the existing spreads keep working.
  const grouped = {
    citySpecific: local,
    regional,
    statewide: [] as typeof local,
  }

  const providers = [...local, ...regional]

  return (
    <MetroPageClient
      params={params}
      initialProviders={providers as any}
      initialGrouped={grouped as any}
      localCount={local.length}
    />
  )
}
