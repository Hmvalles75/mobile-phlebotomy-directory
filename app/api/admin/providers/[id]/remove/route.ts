import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

/**
 * Soft-remove a provider from the directory.
 *
 * Deliberately separate from PATCH /api/admin/providers/[id], which toggles
 * eligibleForLeads — that is the reversible Activate/Deactivate pause used to
 * rest non-converting providers, and must never stamp removedAt or every
 * paused provider would be delisted from the public site.
 *
 * This mirrors what the hand-written removal scripts do (see
 * scripts/remove-diamond-wellness.ts). Rows are never deleted: doNotRelist is
 * the only durable record that a provider asked not to be listed, and a hard
 * delete would let the next import silently recreate the listing.
 *
 * POST   → remove   body: { reason: string }
 * DELETE → restore  (undo a mistaken removal)
 */

// Work the provider genuinely still holds. OPEN and NEW are excluded: a lead
// in those states is back in the pool and its routedToId is stale attribution,
// not an assignment. completedAt is checked separately so a finished draw left
// sitting in CLAIMED does not count as live.
const IN_FLIGHT = ['CLAIMED', 'ROUTING', 'SCHEDULED'] as const

function authed(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    // Requiring a reason is both the audit trail and the friction that stops a
    // mis-click from delisting somebody.
    if (reason.length < 5) {
      return NextResponse.json(
        { ok: false, error: 'A removal reason is required (min 5 characters).' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, removedAt: true,
        primaryStateSlug: true, primaryCitySlug: true,
      },
    })
    if (!provider) {
      return NextResponse.json({ ok: false, error: 'Provider not found' }, { status: 404 })
    }
    if (provider.removedAt) {
      return NextResponse.json(
        { ok: false, error: `Already removed on ${provider.removedAt.toISOString().slice(0, 10)}.` },
        { status: 409 }
      )
    }

    const inFlight = await prisma.lead.findMany({
      where: {
        routedToId: id,
        status: { in: IN_FLIGHT as unknown as any[] },
        completedAt: null,
      },
      select: { id: true, fullName: true, city: true, state: true, claimedAt: true },
      orderBy: { claimedAt: 'desc' },
      take: 25,
    })

    // A warning rather than a hard block. Some of these claims are months old
    // and effectively abandoned, and a provider who has asked to be removed
    // must not stay listed because of stale rows. The admin sees exactly what
    // is live and confirms; force is never the default.
    if (inFlight.length > 0 && body.force !== true) {
      return NextResponse.json(
        {
          ok: false,
          requiresForce: true,
          error: `${inFlight.length} lead(s) are still claimed by this provider. Reassign them, or confirm to remove anyway.`,
          inFlight: inFlight.map(l => ({
            id: l.id,
            patient: l.fullName,
            location: `${l.city}, ${l.state}`,
            claimedAt: l.claimedAt,
          })),
        },
        { status: 409 }
      )
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        removedAt: new Date(),
        removedReason: reason,
        doNotRelist: true,
        eligibleForLeads: false,  // stop lead routing
        notifyEnabled: false,     // stop every provider-facing email
        smsOptOutAt: new Date(),  // nothing can start texting them later
      },
      select: {
        id: true, name: true, slug: true, removedAt: true, removedReason: true,
        doNotRelist: true, eligibleForLeads: true, notifyEnabled: true,
      },
    })

    // Redirects live in next.config.mjs and cannot be written at runtime, so
    // hand the admin the exact line to add rather than leaving a 404 behind.
    const destination = provider.primaryStateSlug && provider.primaryCitySlug
      ? `/us/${provider.primaryStateSlug}/${provider.primaryCitySlug}`
      : provider.primaryStateSlug
        ? `/us/${provider.primaryStateSlug}`
        : '/search'

    console.log(
      `[Admin] Removed provider ${updated.slug}: ${reason}` +
      (inFlight.length > 0 ? ` (forced past ${inFlight.length} claimed lead(s))` : '')
    )

    return NextResponse.json({
      ok: true,
      provider: updated,
      followUp: {
        message: 'Add a 301 to next.config.mjs so the old URL does not 404.',
        source: `/provider/${provider.slug}`,
        destination,
      },
    })
  } catch (error: any) {
    console.error('[Admin Providers] Remove error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to remove provider' }, { status: 500 })
  }
}

/** Undo a mistaken removal. Does not re-enable lead routing — reactivate separately. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!authed(req)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const provider = await prisma.provider.findUnique({
      where: { id },
      select: { id: true, removedAt: true },
    })
    if (!provider) {
      return NextResponse.json({ ok: false, error: 'Provider not found' }, { status: 404 })
    }
    if (!provider.removedAt) {
      return NextResponse.json({ ok: false, error: 'Provider is not removed.' }, { status: 409 })
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        removedAt: null,
        removedReason: null,
        doNotRelist: false,
        notifyEnabled: true,
        // eligibleForLeads intentionally left off — restoring a listing is not
        // the same as opting them back into lead routing. Activate separately.
      },
      select: { id: true, name: true, slug: true, removedAt: true, eligibleForLeads: true },
    })

    console.log(`[Admin] Restored provider ${updated.slug}`)
    return NextResponse.json({
      ok: true,
      provider: updated,
      followUp: {
        message: 'Listing restored. Remove the 301 from next.config.mjs, and Activate separately if they should receive leads.',
      },
    })
  } catch (error: any) {
    console.error('[Admin Providers] Restore error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to restore provider' }, { status: 500 })
  }
}
