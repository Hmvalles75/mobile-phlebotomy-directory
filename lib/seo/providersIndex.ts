import 'server-only'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const PROVIDERS_PER_PAGE = 50

export interface IndexedProvider {
  id: string
  slug: string
  name: string
  primaryCity: string | null
  primaryState: string | null
  description: string | null
}

/**
 * Active-provider list for the /providers index. Same VERIFIED + eligibleForLeads
 * filter used everywhere else, so the index reflects the same providers that
 * actually receive leads.
 */
export const getIndexedProviders = unstable_cache(
  async (): Promise<IndexedProvider[]> => {
    return prisma.provider.findMany({
      where: { status: 'VERIFIED', eligibleForLeads: true },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryCity: true,
        primaryState: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    })
  },
  ['providers-index'],
  { revalidate: 3600, tags: ['internal-links', 'providers-index'] }
)

export function totalProviderPages(count: number): number {
  return Math.max(1, Math.ceil(count / PROVIDERS_PER_PAGE))
}

export function paginate<T>(arr: T[], pageNum: number): T[] {
  const start = (pageNum - 1) * PROVIDERS_PER_PAGE
  return arr.slice(start, start + PROVIDERS_PER_PAGE)
}
