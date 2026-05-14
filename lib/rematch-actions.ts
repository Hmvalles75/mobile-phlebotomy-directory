'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from './prisma'
import { verifyAdminSession } from './admin-auth'
import { isLeadInServiceRadius } from './zip-geocode'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Rematch open leads to a newly-activated provider.
 *
 * The standard lead-notification pipeline has a 4-day age cap
 * (MAX_NOTIFICATION_AGE_DAYS in lib/leadNotifications.ts) which prevents
 * stale leads from re-spamming providers. That cap is sensible — but it
 * creates a gap when a NEW provider activates and there are OPEN leads in
 * their service area sitting unclaimed beyond the cutoff. Per project
 * memory (project_rematch_on_provider_activation.md), this happens roughly
 * every other provider activation: a Long Island lead is open, then Diane
 * activates at Freedom Mobile Lab three days later, and the lead can't
 * route to her.
 *
 * This admin-triggered action bypasses the cap by re-sending the lead
 * notification with a soft, "this has been waiting since X" preamble, and
 * optionally marks the lead routed to the new provider so it stops
 * re-routing to others. Admin-driven (not automatic) so we don't surprise
 * providers and so the timing is intentional.
 */

interface OpenLeadMatch {
  id: string
  fullName: string
  city: string
  state: string
  zip: string
  urgency: string
  createdAt: Date
  notes: string | null
  daysWaiting: number
  notificationCount: number
  alreadyNotifiedThisProvider: boolean
}

/**
 * Find OPEN leads created in the last `days` whose ZIP falls inside the
 * provider's service radius. Returns a list ordered newest-first.
 */
export async function findOpenLeadsInProviderRadius(
  providerId: string,
  days: number = 14,
): Promise<OpenLeadMatch[]> {
  const session = await verifyAdminSession()
  if (!session) throw new Error('Unauthorized')

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true, zipCodes: true, serviceZipCodes: true,
      serviceRadiusMiles: true,
    },
  })
  if (!provider) return []

  const primaryZip = (provider.zipCodes || '').split(',')[0]?.trim()
  if (!primaryZip) return []
  const radius = provider.serviceRadiusMiles || 25

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const candidates = await prisma.lead.findMany({
    where: {
      status: 'OPEN',
      createdAt: { gte: cutoff },
    },
    select: {
      id: true, fullName: true, city: true, state: true, zip: true,
      urgency: true, createdAt: true, notes: true,
      leadNotifications: {
        select: { providerId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const matches: OpenLeadMatch[] = []
  for (const lead of candidates) {
    if (!lead.zip) continue
    if (!isLeadInServiceRadius(primaryZip, lead.zip, radius)) continue
    const daysWaiting = Math.floor((Date.now() - lead.createdAt.getTime()) / 86400000)
    matches.push({
      id: lead.id,
      fullName: lead.fullName,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      urgency: lead.urgency,
      createdAt: lead.createdAt,
      notes: lead.notes,
      daysWaiting,
      notificationCount: lead.leadNotifications.length,
      alreadyNotifiedThisProvider: lead.leadNotifications.some(n => n.providerId === providerId),
    })
  }
  return matches
}

/**
 * Build the rematch-specific email. Softer framing than the fresh-lead
 * template — leads with the recipient that the patient may have already
 * found service, and that this is a backfill rather than a fresh request.
 */
function buildRematchEmail(args: {
  providerName: string
  recipientEmail: string
  leadId: string
  providerId: string
  city: string
  state: string
  zip: string
  urgency: string
  notes: string | null
  daysWaiting: number
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org').replace(/\/+$/, '')
  const claimUrl = `${siteUrl}/claim/${args.leadId}?provider=${args.providerId}`
  const waitedPhrase = args.daysWaiting === 0
    ? 'today'
    : args.daysWaiting === 1
      ? 'yesterday'
      : `${args.daysWaiting} days ago`

  const subject = `Open patient request in ${args.city}, ${args.state} — submitted ${waitedPhrase}`

  const notesShort = (args.notes || '').slice(0, 200)

  const textBody = `Hi ${args.providerName},

A patient in ${args.city}, ${args.state} submitted a request ${waitedPhrase} and we did not yet have a provider in their area to route it to. Since you've just activated coverage there, I'd like to give you a chance at this lead before it ages out.

Location: ${args.city}, ${args.state} ${args.zip}
Urgency: ${args.urgency}${args.notes ? `\nNotes: ${notesShort}${args.notes.length > 200 ? '...' : ''}` : ''}

Worth noting: the patient submitted ${args.daysWaiting > 0 ? `${args.daysWaiting} day${args.daysWaiting === 1 ? '' : 's'} ago, so they may have already found service. ` : ''}Please confirm with them before scheduling.

Claim this patient:
${claimUrl}

No fees, patients pay you directly. No action required if you can't take this one.

— Hector Valles
MobilePhlebotomy.org
`

  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background-color: #6b7280; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
  .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
  .button { display: inline-block; padding: 16px 36px; background-color: #28a745; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
  .footer { padding: 20px; text-align: center; color: #777; font-size: 13px; }
  .detail-row { margin: 10px 0; }
  .detail-label { font-weight: bold; color: #555; }
  .heads-up { background: #fef3c7; border: 1px solid #fcd34d; color: #78350f; padding: 12px 16px; border-radius: 5px; margin: 16px 0; font-size: 14px; }
</style></head>
<body><div class="container">
  <div class="header"><h2 style="margin: 0;">Open patient request — backfill</h2></div>
  <div class="content">
    <p>Hi ${args.providerName},</p>
    <p>A patient in <strong>${args.city}, ${args.state}</strong> submitted a request <strong>${waitedPhrase}</strong> and we did not yet have a provider in their area to route it to. Since you've just activated coverage there, I'd like to give you a chance at this lead before it ages out.</p>
    <div style="background: white; padding: 18px; border-radius: 5px; margin: 16px 0;">
      <div class="detail-row"><span class="detail-label">Location:</span> ${args.city}, ${args.state} ${args.zip}</div>
      <div class="detail-row"><span class="detail-label">Urgency:</span> ${args.urgency}</div>
      ${args.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span> ${notesShort}${args.notes.length > 200 ? '...' : ''}</div>` : ''}
    </div>
    ${args.daysWaiting > 0 ? `<div class="heads-up">Heads up: this patient submitted ${args.daysWaiting} day${args.daysWaiting === 1 ? '' : 's'} ago. They may have already found service elsewhere — please confirm with them before scheduling.</div>` : ''}
    <center>
      <a href="${claimUrl}" class="button">Claim this patient</a>
    </center>
    <p style="color: #777; font-size: 13px; margin-top: 24px;">No fees, patients pay you directly. No action required if you can't take this one.</p>
  </div>
  <div class="footer">
    <p>— Hector Valles<br>MobilePhlebotomy.org</p>
  </div>
</div></body></html>`

  return { subject, text: textBody, html: htmlBody }
}

interface RematchOptions {
  markRouted: boolean  // if true, set Lead.routedToId so it stops re-routing
}

/**
 * Re-send a notification email for one specific open lead to one specific
 * provider. Creates a LeadNotification audit row. Optionally marks the
 * lead as routedToId=providerId so the regular cron stops re-routing it.
 */
export async function rematchProviderToLead(
  providerId: string,
  leadId: string,
  options: RematchOptions = { markRouted: false },
): Promise<{ ok: boolean; error?: string }> {
  const session = await verifyAdminSession()
  if (!session) return { ok: false, error: 'Unauthorized' }

  if (!process.env.SENDGRID_API_KEY || !process.env.LEAD_EMAIL_FROM) {
    return { ok: false, error: 'SendGrid not configured' }
  }

  const [provider, lead] = await Promise.all([
    prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true, name: true,
        email: true, claimEmail: true, notificationEmail: true,
      },
    }),
    prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true, fullName: true, city: true, state: true, zip: true,
        urgency: true, notes: true, createdAt: true, status: true,
      },
    }),
  ])
  if (!provider) return { ok: false, error: 'Provider not found' }
  if (!lead) return { ok: false, error: 'Lead not found' }
  if (lead.status !== 'OPEN') return { ok: false, error: `Lead is ${lead.status}, not OPEN` }

  const recipientEmail = provider.notificationEmail || provider.claimEmail || provider.email
  if (!recipientEmail) return { ok: false, error: 'Provider has no email on file' }

  const daysWaiting = Math.floor((Date.now() - lead.createdAt.getTime()) / 86400000)
  const { subject, text, html } = buildRematchEmail({
    providerName: provider.name,
    recipientEmail,
    leadId: lead.id,
    providerId: provider.id,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    urgency: lead.urgency,
    notes: lead.notes,
    daysWaiting,
  })

  // Create a LeadNotification row first (so it's idempotent / audit-trailed
  // even if the send below fails — we update its status when we know).
  const notification = await prisma.leadNotification.create({
    data: {
      leadId: lead.id,
      providerId: provider.id,
      channel: 'email',
      status: 'QUEUED',
    },
    select: { id: true },
  })

  try {
    const [response] = await sg.send({
      to: recipientEmail,
      from: process.env.LEAD_EMAIL_FROM!,
      replyTo: 'hector@mobilephlebotomy.org',
      subject,
      text,
      html,
      customArgs: {
        kind: 'rematch_notification',
        leadId: lead.id,
        providerId: provider.id,
        leadNotificationId: notification.id,
      },
    } as any)
    const sgMessageId = (response?.headers as any)?.['x-message-id'] || null

    await prisma.leadNotification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date(), sgMessageId: sgMessageId || null },
    })

    if (options.markRouted) {
      // Mark this provider as the lead's routedToId so the regular cron
      // doesn't keep re-routing it to others. status stays OPEN since the
      // provider hasn't actually claimed yet — they'll claim via the email.
      await prisma.lead.update({
        where: { id: leadId },
        data: { routedToId: providerId },
      })
    }

    revalidatePath(`/admin/providers/${providerId}/rematch`)
    return { ok: true }
  } catch (err: any) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Send failed'
    await prisma.leadNotification.update({
      where: { id: notification.id },
      data: { status: 'FAILED', errorMessage: msg },
    })
    return { ok: false, error: msg }
  }
}

/**
 * Form-action wrapper — called from a <form action={...}> on the admin
 * page. Reads providerId/leadId/markRouted from FormData.
 */
export async function rematchAction(formData: FormData) {
  const providerId = String(formData.get('providerId') || '')
  const leadId = String(formData.get('leadId') || '')
  const markRouted = formData.get('markRouted') === 'true'
  if (!providerId || !leadId) return
  await rematchProviderToLead(providerId, leadId, { markRouted })
}
