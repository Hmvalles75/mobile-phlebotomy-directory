import { prisma } from './prisma'
import { sendTransactionalEmail } from './sendTransactionalEmail'

/**
 * Close a lead by hand: the admin "Close this lead" button and the requester's
 * own cancel on /request/[token] share this. Nothing is deleted or re-offered;
 * routedToId (claim history) is kept. If the lead was CLAIMED, the claimer is
 * emailed a short provider-safe reason so they stop working it; it leaves
 * their dashboard queue the moment the status flips. If it was still OPEN
 * with head-start sends queued at SendGrid, those are cancelled so no provider
 * is invited to a request that no longer exists.
 */
export const CLOSE_STATUSES = ['CLOSED_DUPLICATE', 'CLOSED_DECLINED', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED', 'EXPIRED_NO_RESPONSE', 'CLOSED_PATIENT_CANCELLED'] as const
export type CloseStatus = typeof CLOSE_STATUSES[number]
export const TERMINAL_STATUSES = new Set<string>([...CLOSE_STATUSES, 'COMPLETED'])

/** What the claiming provider is told; admin notes stay internal. */
const PROVIDER_REASON: Record<CloseStatus, string> = {
  CLOSED_DUPLICATE: 'It was a duplicate of another request or not a genuine patient.',
  CLOSED_DECLINED: 'The patient has decided not to go ahead.',
  CLOSED_PRICING_ONLY: 'The patient only wanted a price and is not booking.',
  CLOSED_UNCONFIRMED: 'The patient has not responded to anyone and I am not going to keep it open.',
  EXPIRED_NO_RESPONSE: 'The request has aged out.',
  CLOSED_PATIENT_CANCELLED: 'The patient cancelled the request themselves.',
}

export interface CloseLeadInput {
  leadId: string
  status: CloseStatus
  note: string
  actor: 'admin' | 'patient'
  /** Also clear the high-value flag and estimated value (admin junk closes). */
  junk?: boolean
}

export type CloseLeadResult =
  | { ok: true; from: string; status: CloseStatus; providerTold: boolean }
  | { ok: false; code: 'not_found' | 'already_terminal'; status?: string }

export async function closeLead(input: CloseLeadInput): Promise<CloseLeadResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      status: true, outcomeNotes: true, fullName: true, city: true, state: true, routedToId: true,
      provider: { select: { id: true, name: true, notificationEmail: true, claimEmail: true, email: true, notifyEnabled: true } },
    },
  })
  if (!lead) return { ok: false, code: 'not_found' }
  if (TERMINAL_STATUSES.has(lead.status)) return { ok: false, code: 'already_terminal', status: lead.status }

  const stamp = `Closed by ${input.actor} ${new Date().toISOString().slice(0, 10)}${input.junk ? ' (junk)' : ''}: ${input.note}`
  const flipped = await prisma.lead.updateMany({
    where: { id: input.leadId, status: lead.status },   // guard against a concurrent flip
    data: {
      status: input.status,
      outcomeUpdatedAt: new Date(),
      outcomeNotes: lead.outcomeNotes ? `${lead.outcomeNotes}\n\n${stamp}` : stamp,
      ...(input.status === 'CLOSED_PATIENT_CANCELLED' ? { patientCancelledAt: new Date() } : {}),
      ...(input.junk ? { isHighValue: false, estimatedValueCents: 0 } : {}),
    },
  })
  if (flipped.count === 0) return { ok: false, code: 'already_terminal', status: lead.status }
  console.log(`[closeLead] ${input.actor} closed ${input.leadId}: ${lead.status} -> ${input.status}`)

  // Head-start sends still queued at SendGrid must not go out for a request
  // that no longer exists. Deliberately NOT cancelLeadNotifications(): that
  // also emails everyone who did receive it a "just claimed" note, which is
  // wrong for a cancel. Batch cancel + mark queued rows only.
  if (lead.status === 'OPEN') await cancelQueuedLeadSends(input.leadId)

  let providerTold = false
  const to = lead.provider?.notificationEmail || lead.provider?.claimEmail || lead.provider?.email
  if (lead.status === 'CLAIMED' && to && lead.provider?.notifyEnabled !== false) {
    const why = PROVIDER_REASON[input.status]
    const text = `Hi ${lead.provider!.name.trim()},

I've closed the request from ${lead.fullName} in ${lead.city}, ${lead.state} that you accepted. ${why} No action needed on your end, and nothing is held against you for it.

Hector Valles
MobilePhlebotomy.org`
    const err = await sendTransactionalEmail({
      to,
      subject: `Closed: ${lead.fullName} (${lead.city}, ${lead.state}) — no action needed`,
      text,
      html: `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
    })
    providerTold = !err
    if (err) console.error(`[closeLead] provider notice failed for ${input.leadId}: ${err}`)
  }
  return { ok: true, from: lead.status, status: input.status, providerTold }
}

async function cancelQueuedLeadSends(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { notificationBatchId: true } })
    if (lead?.notificationBatchId && process.env.SENDGRID_API_KEY) {
      const resp = await fetch('https://api.sendgrid.com/v3/user/scheduled_sends', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: lead.notificationBatchId, status: 'cancel' }),
      })
      if (!(resp.ok || resp.status === 201)) console.warn(`[closeLead] SendGrid batch cancel returned ${resp.status}`)
    }
    await prisma.leadNotification.updateMany({
      where: { leadId, status: 'QUEUED' },
      data: { status: 'CANCELLED', errorMessage: 'Cancelled: request closed before delivery' },
    })
  } catch (err: any) {
    console.error(`[closeLead] cancelQueuedLeadSends failed for ${leadId}:`, err?.message || err)
  }
}
