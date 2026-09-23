import { prisma } from './prisma'
import { notifyFeaturedProvidersForLead, recordProviderDecline, renotifyOpenLead } from './leadNotifications'

/**
 * A claimer hands a lead back: release it atomically and re-offer it at once.
 *
 * The same sequence the "Can't serve this area" button uses
 * (app/api/leads/[leadId]/update-status) and the one-tap "hand it back" link
 * in the soft-outcome nudge. Re-offer is awaited on purpose: Next 14 on Vercel
 * has no waitUntil, so a fire-and-forget send can be cut off when the response
 * returns. Never-notified providers get the lead first; providers who already
 * saw it get the 12h-gated still-unclaimed reminder; the provider handing it
 * back is excluded from both.
 *
 * Returns false when the lead is no longer CLAIMED by this provider.
 */
export async function handBackLead(input: {
  leadId: string
  providerId: string
  reason: string          // stored on releaseReason, e.g. 'provider_cannot_serve', 'provider_handback'
  note: string            // human-readable, stored on outcomeNotes
  providerNotes?: string | null
}): Promise<boolean> {
  const released = await prisma.lead.updateMany({
    where: { id: input.leadId, routedToId: input.providerId, status: 'CLAIMED' },
    data: {
      status: 'OPEN', routedToId: null, claimedAt: null, firstContactAt: null, callAttempts: 0,
      outcome: null, outcomeUpdatedAt: new Date(),
      outcomeNotes: input.note,
      releasedFromProviderId: input.providerId, releasedAt: new Date(), releaseReason: input.reason,
      ...(input.providerNotes ? { providerNotes: input.providerNotes } : {}),
    },
  })
  if (released.count === 0) return false
  await recordProviderDecline(input.leadId, input.providerId)
  console.log(`[handBackLead] ${input.providerId} handed back ${input.leadId} (${input.reason}); re-offering`)
  try {
    await notifyFeaturedProvidersForLead(input.leadId, { onlyNewProviders: true })
    await renotifyOpenLead(input.leadId, { excludeProviderIds: [input.providerId] })
  } catch (err: any) {
    console.error(`[handBackLead] re-offer failed for ${input.leadId}:`, err?.message || err)
  }
  return true
}
