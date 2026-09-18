import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Minimal public card data for a provider, consumed by the edge-runtime OG
 * image route (app/provider/[slug]/opengraph-image.tsx). Edge functions
 * cannot run Prisma, so the image route fetches this instead.
 *
 * Only fields that are already public on the provider page. Cached at the
 * CDN for an hour; the image route caches on its own too.
 */
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const p = await prisma.provider.findUnique({
    where: { slug: params.slug },
    select: { name: true, primaryCity: true, primaryState: true, heroPoster: true, profileImage: true, logo: true, removedAt: true },
  })
  if (!p || p.removedAt) {
    return NextResponse.json({ ok: false }, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=300' } })
  }
  return NextResponse.json(
    { ok: true, name: p.name, city: p.primaryCity, state: p.primaryState, heroPoster: p.heroPoster, profileImage: p.profileImage, logo: p.logo },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  )
}
