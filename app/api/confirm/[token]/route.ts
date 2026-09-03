import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Records the patient's answer. POST only.
 *
 * Deliberately not a GET, and the outcome is not in the URL: email security
 * scanners fetch every link in a message before the recipient sees it, so an
 * answer encoded in a link would be filled in by a machine. Every recorded
 * outcome here required someone to press a button on the page.
 *
 * Writes patientOutcome, patientOutcomeReason and patientOutcomeAt, and
 * NOTHING else. No status transition, no provider notification, no effect on
 * routing. If a patient says the draw did not happen, that disagreement is
 * data to be read later, not an action to take now.
 */

const REASONS = new Set([
  'never_contacted',
  'no_showed',
  'rescheduled_pending',
  'cancelled_or_other_provider',
  'other',
])

/**
 * Per-IP throttle.
 *
 * There is no rate-limiting utility in this codebase and no Upstash, so this
 * is an in-memory Map. It resets on cold start and is per-instance, which on
 * serverless makes it a speed bump rather than a real limiter — worth being
 * honest about. The actual protection is that a token is a nanoid(32), is
 * single-use, and 409s the moment an answer exists.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) {
    // Bounded so a long-lived instance cannot grow this without limit.
    for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k)
  }
  return recent.length > MAX_PER_WINDOW
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const outcome = body?.outcome
    if (outcome !== 'COMPLETED' && outcome !== 'NOT_COMPLETED') {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })
    }

    let reason: string | null = null
    if (outcome === 'NOT_COMPLETED' && body?.reason) {
      const raw = String(body.reason).slice(0, 200)
      // Either one of the fixed choices, or free text from the "Other" box.
      reason = REASONS.has(raw) ? raw : raw.trim() || null
    }

    const lead = await prisma.lead.findUnique({
      where: { patientOutcomeToken: params.token },
      select: { id: true, patientOutcome: true },
    })

    // Same shape whether the token is unknown or malformed — the response must
    // not tell an unauthenticated caller whether a lead exists.
    if (!lead) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }
    if (lead.patientOutcome) {
      return NextResponse.json(
        { error: 'Already answered', outcome: lead.patientOutcome },
        { status: 409 }
      )
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        patientOutcome: outcome,
        patientOutcomeReason: reason,
        patientOutcomeAt: new Date(),
      },
    })

    console.log(`[confirm] lead ${lead.id} -> ${outcome}${reason ? ` (${reason})` : ''}`)
    return NextResponse.json({ ok: true, outcome })
  } catch (error: any) {
    console.error('[confirm] failed:', error?.message || error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
