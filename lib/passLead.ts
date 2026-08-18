import { prisma } from './prisma'
import { PAID_HEAD_START_SECONDS } from './leadNotifications'

/**
 * A paying provider handing a lead back inside their head-start window.
 *
 * The window exists so a paying provider gets first look. Its cost is borne by
 * everyone else: free providers can't see the lead and the patient waits, for
 * the full ten minutes, whether the paying provider is weighing it up or simply
 * isn't at their desk. The pass collapses that to seconds — it is what makes
 * charging for a head start defensible rather than just a tax on the patient.
 *
 * Promised to D Ferrell (Dynamic Stix) in writing on 2026-08-14.
 *
 * Releasing means clearing the dashboard gate, which is the path that actually
 * matters: of six contested claims in 90 days, five landed inside 30 seconds —
 * far too fast to be anyone reading an email. Free providers see a passed lead
 * the moment they refresh.
 *
 * The held Wave 2 emails still arrive on their original SendGrid schedule
 * rather than being cancelled and re-fired immediately. That re-send is a
 * genuinely separate piece of work — it would mean cancelling the batch and
 * re-notifying a subset of providers, creating a second set of notification
 * rows — and it is strictly an improvement on top of this, not a prerequisite.
 * Nothing here is worse than the current behaviour for anyone.
 */

export type PassResult =
  | { ok: true; leadCity: string; leadState: string }
  | { ok: false; reason: 'not_found' | 'not_notified' | 'not_paying' | 'already_claimed' | 'already_passed' | 'window_closed' }

export async function passLead(leadId: string, providerId: string): Promise<PassResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, city: true, state: true, routedToId: true },
  })
  if (!lead) return { ok: false, reason: 'not_found' }

  // Someone already took it — there is nothing left to hand back.
  if (lead.routedToId || lead.status !== 'OPEN') {
    return { ok: false, reason: 'already_claimed' }
  }

  // Only a provider who was actually sent this lead can pass it, and only a
  // paying one — a free provider has no window to give up. This is the whole
  // authorisation check: the link carries no secret, exactly like the claim
  // link, so it must not be able to do anything a stranger shouldn't.
  const notification = await prisma.leadNotification.findFirst({
    where: { leadId, providerId },
    select: {
      id: true, createdAt: true, passedAt: true,
      provider: { select: { priorityRouting: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!notification) return { ok: false, reason: 'not_notified' }
  if (!notification.provider.priorityRouting) return { ok: false, reason: 'not_paying' }
  if (notification.passedAt) return { ok: false, reason: 'already_passed' }

  // Past the window the lead is public anyway, so a pass would be a no-op that
  // still logged as though it did something.
  const windowClosesAt = notification.createdAt.getTime() + PAID_HEAD_START_SECONDS * 1000
  if (Date.now() > windowClosesAt) return { ok: false, reason: 'window_closed' }

  await prisma.leadNotification.update({
    where: { id: notification.id },
    data: { passedAt: new Date() },
  })

  console.log(
    `[PassLead] ${notification.provider.name} passed lead ${leadId} ` +
    `(${lead.city}, ${lead.state}) — released to free providers immediately`
  )

  return { ok: true, leadCity: lead.city ?? '', leadState: lead.state ?? '' }
}
