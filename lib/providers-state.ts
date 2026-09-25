import { unstable_cache } from 'next/cache'
import type { EnrichedProvider } from './providers-db'
import { getAllProvidersCached } from './providers-city'
import { normalizeState } from './location-utils'

/**
 * The providers a state page lists: same rule as /api/providers?state=XX
 * (a coverage row in the state, or the state as home). Server-side so the
 * count is in the initial HTML and the metadata; the client grid used to
 * fetch this after hydration and render "0 providers" in the meantime
 * (2026-09-25, site batch 4).
 */
export function filterProvidersByState(all: EnrichedProvider[], stateAbbrOrName: string): EnrichedProvider[] {
  const normalizedState = normalizeState(stateAbbrOrName)
  if (!normalizedState) return []
  return all.filter(p => (p.coverage?.states && p.coverage.states.includes(normalizedState)) || p.state === normalizedState)
}

export const getProvidersForState = unstable_cache(
  async (stateAbbr: string): Promise<EnrichedProvider[]> => filterProvidersByState(await getAllProvidersCached(), stateAbbr),
  ['providers-for-state'],
  { revalidate: 300, tags: ['internal-links'] },
)
