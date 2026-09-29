import { prisma } from './prisma'
import { sendLeadExpiredNotice } from './leadExpiredNotice'

/**
 * Unclaimed-lead expiry (app/api/cron/expire-stale-leads).
 *
 * OPEN leads that providers were sent and nobody claimed within STALE_DAYS
 * become EXPIRED_NO_RESPONSE (providers were asked; none answered — distinct
 * from NEEDS_COVERAGE, where nobody was available) and the requester gets the
 * "we couldn't find a provider" email with next steps. 14 days -> 4 days on
 * 2026-09-29: after four days a patient has long since given up, and the
 * silence was the worst part.
 *
 * Idempotent: the status flip is the guard. Each lead is flipped with a
 * conditional updateMany before its email is sent, so a slow send can never
 * double-fire on the next tick.
 */
export const STALE_DAYS = 4

export interface ExpireResult {
  dryRun: boolean
  cutoff: string
  found: number
  closed: number
  emailed: number
  skippedNoEmail: number
  errors: { leadId: string; error: string }[]
  leads: { id: string; city: string; state: string; ageDays: number; providersNotified: number; email: boolean }[]
}

export async function runExpireStaleLeads(opts: { dryRun?: boolean } = {}): Promise<ExpireResult> {
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)
  const stale = await prisma.lead.findMany({
    where: { status: 'OPEN', createdAt: { lt: cutoff } },
    select: { id: true, fullName: true, email: true, city: true, state: true, zip: true, createdAt: true, _count: { select: { leadNotifications: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const r: ExpireResult = {
    dryRun: !!opts.dryRun, cutoff: cutoff.toISOString(), found: stale.length, closed: 0, emailed: 0, skippedNoEmail: 0, errors: [],
    leads: stale.map(l => ({ id: l.id, city: l.city, state: l.state, ageDays: Math.floor((Date.now() - l.createdAt.getTime()) / 86400e3), providersNotified: l._count.leadNotifications, email: !!l.email })),
  }
  if (opts.dryRun) return r

  for (const l of stale) {
    try {
      const flipped = await prisma.lead.updateMany({
        where: { id: l.id, status: 'OPEN' },
        data: {
          status: 'EXPIRED_NO_RESPONSE',
          outcomeUpdatedAt: new Date(),
          outcomeNotes: `Auto-expired after ${STALE_DAYS} days: sent to ${l._count.leadNotifications} provider(s), none claimed.`,
        },
      })
      if (flipped.count === 0) continue
      r.closed++
      if (!l.email) { r.skippedNoEmail++; continue }
      const err = await sendLeadExpiredNotice({ id: l.id, fullName: l.fullName, email: l.email, city: l.city, state: l.state, providersNotified: l._count.leadNotifications })
      if (err) r.errors.push({ leadId: l.id, error: err })
      else r.emailed++
    } catch (err: any) {
      r.errors.push({ leadId: l.id, error: err?.message || String(err) })
    }
  }
  console.log(`[ExpireStaleLeads] found=${r.found} closed=${r.closed} emailed=${r.emailed} noEmail=${r.skippedNoEmail} errors=${r.errors.length}`)
  return r
}
