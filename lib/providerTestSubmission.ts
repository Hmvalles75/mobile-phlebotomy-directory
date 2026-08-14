import { prisma } from './prisma'
import { SITE_URL } from './seo'
import sg from '@sendgrid/mail'

/**
 * Provider test submissions.
 *
 * New providers routinely submit a fake patient request to check the system
 * works. It is reasonable behaviour — they want proof before they rely on us —
 * but the cost lands on everyone else. On 2026-08-13 TCF Lab Service submitted
 * one from their own notification address; it fanned out to 8 real DFW
 * providers, and Comfort Mobile Phlebotomy claimed it, called, left a voicemail
 * and a text, and logged a VOICEMAIL outcome before working out it was not a
 * real patient.
 *
 * The tester only ever needed one thing: to see the notification email arrive.
 * So serve the test to the tester and to nobody else — send them the message
 * they would have received, skip the fan-out entirely, and close the lead.
 *
 * Deliberately not airtight. A provider testing from a personal address won't
 * match, and that is fine: the failure mode is simply today's behaviour.
 */

export interface ProviderTestMatch {
  providerId: string
  providerName: string
  recipientEmail: string
  matchedOn: 'email' | 'phone'
}

/** Digits only, last 10 — normalises 555-123-4567, +1 555 123 4567, etc. */
function last10(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '').slice(-10)
}

/**
 * Does this submission's contact info already belong to a provider?
 *
 * Matches on exact email (any of the three provider address fields) or on a
 * normalised 10-digit phone (phone or phonePublic). Address is deliberately NOT
 * matched — shared buildings and suite numbers make it far too loose.
 *
 * One indexed lookup on a small table; it runs once per submission and returns
 * null for effectively every real patient.
 */
export async function findProviderBySubmissionContact(
  email: string | null | undefined,
  phone: string | null | undefined,
): Promise<ProviderTestMatch | null> {
  const emailKey = (email ?? '').trim().toLowerCase()
  const phoneKey = last10(phone)
  const phoneParam = phoneKey.length === 10 ? phoneKey : ''

  if (!emailKey && !phoneParam) return null

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string
    name: string | null
    email: string | null
    claimEmail: string | null
    notificationEmail: string | null
    matched_on: string
  }>>(
    `SELECT id, name, email, "claimEmail", "notificationEmail",
            CASE WHEN $1 <> '' AND (
                      lower(coalesce(email, '')) = $1
                   OR lower(coalesce("claimEmail", '')) = $1
                   OR lower(coalesce("notificationEmail", '')) = $1
                 ) THEN 'email' ELSE 'phone' END AS matched_on
       FROM providers
      WHERE "removedAt" IS NULL
        AND (
              ($1 <> '' AND (
                      lower(coalesce(email, '')) = $1
                   OR lower(coalesce("claimEmail", '')) = $1
                   OR lower(coalesce("notificationEmail", '')) = $1))
           OR ($2 <> '' AND (
                      right(regexp_replace(coalesce(phone, ''), '\\D', '', 'g'), 10) = $2
                   OR right(regexp_replace(coalesce("phonePublic", ''), '\\D', '', 'g'), 10) = $2))
            )
      LIMIT 1`,
    emailKey,
    phoneParam,
  )

  const row = rows[0]
  if (!row) return null

  const recipientEmail = row.notificationEmail || row.claimEmail || row.email
  if (!recipientEmail) return null

  return {
    providerId: row.id,
    providerName: row.name || 'there',
    recipientEmail,
    matchedOn: row.matched_on === 'email' ? 'email' : 'phone',
  }
}

/**
 * Close a test submission and show the tester what a real notification looks
 * like. Never notifies anyone else.
 *
 * Reuses CLOSED_UNCONFIRMED rather than introducing a status: it is terminal
 * and inert — every reference to it in app/ and lib/ writes it, none reads it
 * as a trigger — so nothing will ever act on this row again. The [TEST] note
 * prefix is what makes it identifiable in the admin panel and excludable from
 * funnel counts.
 *
 * Best-effort on the email: a send failure must not fail the submission.
 */
export async function handleProviderTestSubmission(
  lead: {
    id: string
    fullName: string | null
    city: string | null
    state: string | null
    zip: string | null
    urgency: string | null
    labPreference: string | null
    notes: string | null
  },
  match: ProviderTestMatch,
): Promise<void> {
  const marker =
    `[TEST ${new Date().toISOString().slice(0, 10)} — submitted from contact details already on ` +
    `provider ${match.providerId} (${match.providerName}), matched on ${match.matchedOn}. ` +
    `Not fanned out to any provider. Excluded from funnel metrics.] `

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'CLOSED_UNCONFIRMED',
      notes: marker + (lead.notes ?? ''),
    },
  })

  console.log(
    `[ProviderTest] Lead ${lead.id} matched provider ${match.providerId} on ${match.matchedOn} — ` +
    `fan-out skipped, preview sent to ${match.recipientEmail}`
  )

  const fromEmail = process.env.LEAD_EMAIL_FROM
  if (!fromEmail || !process.env.SENDGRID_API_KEY) {
    console.warn('[ProviderTest] SendGrid not configured — preview email skipped')
    return
  }
  sg.setApiKey(process.env.SENDGRID_API_KEY)

  const siteUrl = SITE_URL.replace(/\/+$/, '')
  const where = `${lead.city ?? ''}, ${lead.state ?? ''} ${lead.zip ?? ''}`.trim()
  const notesShort = lead.notes ? lead.notes.substring(0, 200) : 'None'

  // Mirrors the real provider notification (lib/leadNotifications.ts) so what
  // they see here is what they will get. The claim button is described rather
  // than linked — a live claim link on a closed lead would only produce an
  // error, which is the opposite of reassuring.
  const text = `Hi ${match.providerName},

This is a preview, not a real patient.

We spotted that the request just submitted used contact details already on your
listing, so we treated it as a test. It was NOT sent to any other provider.

Here is exactly what you would have received had it been a real patient:

------------------------------------------------------------
New patient request in ${where} just came in!

Location: ${where}
Lab preference: ${lead.labPreference ?? 'Not specified'}
Urgency: ${lead.urgency ?? 'Standard'}
Notes: ${notesShort}

[ Claim This Patient ]
  In a real request this button opens the patient's full name, phone number
  and address. First provider to claim gets the patient.

First provider to claim gets the patient. No fees — this referral is completely
free. You bill the patient directly at your own rate. We don't charge fees or
take a commission.
------------------------------------------------------------

So: it works. When a real patient in your area submits a request, that email
lands in this inbox within seconds.

Two things worth doing now:
1. Add ${fromEmail} to your contacts so these never land in spam.
2. Check your listing at ${siteUrl}/dashboard — coverage ZIPs and radius decide
   which requests reach you.

If that submission was a real request rather than a test, just reply and I'll
route it properly.

Best,
Hector Valles
MobilePhlebotomy.org`

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
  <strong style="color:#78350f;">This is a preview, not a real patient.</strong>
  <p style="margin:6px 0 0 0;color:#78350f;font-size:14px;">The request you just submitted used contact details already on your listing, so we treated it as a test. It was <strong>not</strong> sent to any other provider.</p>
</div>

<p>Hi ${match.providerName},</p>
<p>Here is exactly what you would have received had it been a real patient:</p>

<div style="border:1px solid #e5e7eb;border-radius:8px;padding:18px 20px;margin:16px 0;">
  <p style="margin:0 0 12px 0;font-weight:600;">New patient request in ${where} just came in!</p>
  <p style="margin:0 0 4px 0;"><strong>Location:</strong> ${where}</p>
  <p style="margin:0 0 4px 0;"><strong>Lab preference:</strong> ${lead.labPreference ?? 'Not specified'}</p>
  <p style="margin:0 0 4px 0;"><strong>Urgency:</strong> ${lead.urgency ?? 'Standard'}</p>
  <p style="margin:0 0 14px 0;"><strong>Notes:</strong> ${notesShort}</p>
  <div style="background:#e5e7eb;color:#6b7280;text-align:center;padding:12px;border-radius:6px;font-weight:600;">Claim This Patient</div>
  <p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">In a real request this button opens the patient's full name, phone number and address. First provider to claim gets the patient.</p>
  <p style="margin:12px 0 0 0;font-size:13px;color:#6b7280;">No fees — this referral is completely free. You bill the patient directly at your own rate. We don't charge fees or take a commission.</p>
</div>

<p><strong>So: it works.</strong> When a real patient in your area submits a request, that email lands in this inbox within seconds.</p>

<p>Two things worth doing now:</p>
<ol>
  <li>Add ${fromEmail} to your contacts so these never land in spam.</li>
  <li>Check your listing at <a href="${siteUrl}/dashboard" style="color:#667eea;">your dashboard</a> — coverage ZIPs and radius decide which requests reach you.</li>
</ol>

<p style="color:#6b7280;font-size:14px;">If that submission was a real request rather than a test, just reply and I'll route it properly.</p>

<p>Best,<br><strong>Hector Valles</strong><br>MobilePhlebotomy.org</p>
</body></html>`

  try {
    await sg.send({
      to: match.recipientEmail,
      from: fromEmail,
      replyTo: 'hector@mobilephlebotomy.org',
      subject: `Your test request came through — here's what a real one looks like`,
      text,
      html,
    })
    console.log(`[ProviderTest] ✅ Preview sent to ${match.recipientEmail}`)
  } catch (err: any) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown error'
    console.error(`[ProviderTest] Preview email failed for ${match.recipientEmail}: ${msg}`)
  }
}
