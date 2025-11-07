import { prisma } from './prisma'

export async function routeLeadToProvider(zip: string) {
  // Prioritize: VERIFIED w/ coverage, then FEATURED, else null
  const providers = await prisma.provider.findMany({
    where: {
      status: 'VERIFIED',
      OR: [
        { zipCodes: { contains: zip } },  // Simple contains check for comma-separated zips
        { zipCodes: null }  // Nationwide providers
      ]
    },
    orderBy: [
      { isFeatured: 'desc' },
      { featuredTier: 'desc' },
      { updatedAt: 'desc' }
    ],
    take: 1
  })
  return providers[0] ?? null
}
