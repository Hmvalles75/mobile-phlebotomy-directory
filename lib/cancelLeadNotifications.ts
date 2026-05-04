import { prisma } from './prisma'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Called after a lead is successfully claimed. Two responsibilities:
 *
 *   1. Cancel any still-scheduled SendGrid sends for this lead's batch.
 *      Wave 2 emails (10-min delay for non-paying providers) are queued
 *      at SendGrid until their sendAt time fires. If the lead gets claimed
 *      within that window, we cancel the batch so those emails never go
 *      out — preserving the paying customer's first-bid window in practice,
 *      not just in theory.
 *
 *   2. Send a brief courtesy "lead claimed" email to providers who already
 *      received the original notification (Wave 1, fired immediately).
 *      Tells them not to waste time clicking the dead claim link, and
 *      builds trust ("the system tells me what happens to leads, not just
 *      handing them out and ghosting").
 *
 * Best-effort — failures here don't block the claim. Logged and swallowed.
 */
export async function cancelLeadNotifications(leadId: string, claimingProviderId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true, city: true, state: true, zip: true,
        notificationBatchId: true,
      },
    })
    if (!lead) {
      console.error(`[CancelNotifications] Lead ${leadId} not found`)
      return
    }

    // ── Step 1: Cancel scheduled SendGrid batch ─────────────────────
    if (lead.notificationBatchId && process.env.SENDGRID_API_KEY) {
      try {
        const resp = await fetch('https://api.sendgrid.com/v3/user/scheduled_sends', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batch_id: lead.notificationBatchId, status: 'cancel' }),
        })
        if (resp.ok || resp.status === 201) {
          console.log(`[CancelNotifications] ✅ Cancelled SendGrid batch ${lead.notificationBatchId}`)
        } else {
          const text = await resp.text()
          console.warn(`[CancelNotifications] SendGrid cancel returned ${resp.status}: ${text}`)
        }
      } catch (err: any) {
        console.warn(`[CancelNotifications] SendGrid cancel error:`, err.message || err)
      }
    }

    // ── Step 2: Courtesy email to other notified providers ──────────
    const notifications = await prisma.leadNotification.findMany({
      where: {
        leadId: lead.id,
        providerId: { not: claimingProviderId },
        status: { in: ['SENT', 'QUEUED'] },
      },
      select: {
        providerId: true,
        provider: {
          select: { name: true, notificationEmail: true, claimEmail: true, email: true },
        },
      },
    })

    if (notifications.length === 0) {
      console.log(`[CancelNotifications] No other providers to notify`)
      return
    }

    const fromEmail = process.env.LEAD_EMAIL_FROM
    if (!fromEmail || !process.env.SENDGRID_API_KEY) {
      console.warn(`[CancelNotifications] Missing SendGrid config — skipping courtesy emails`)
      return
    }

    const subject = `Update: ${lead.city}, ${lead.state} request was just claimed`

    let sent = 0
    let skipped = 0
    for (const n of notifications) {
      const recipient = n.provider.notificationEmail || n.provider.claimEmail || n.provider.email
      if (!recipient) { skipped++; continue }

      const text = `Hi ${n.provider.name},

Quick update — the patient request in ${lead.city}, ${lead.state} (${lead.zip}) was just claimed by another provider in your area, so no action needed on your side.

We'll let you know when the next request lands near you.

— MobilePhlebotomy.org`

      const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi ${n.provider.name},</p>
<p>Quick update — the patient request in <strong>${lead.city}, ${lead.state} (${lead.zip})</strong> was just claimed by another provider in your area, so no action needed on your side.</p>
<p>We'll let you know when the next request lands near you.</p>
<p style="color: #6b7280; font-size: 14px;">— MobilePhlebotomy.org</p>
</body></html>`

      try {
        await sg.send({
          to: recipient,
          from: fromEmail,
          subject,
          text,
          html,
        })
        sent++
      } catch (err: any) {
        console.warn(`[CancelNotifications] Courtesy email failed for ${n.provider.name}:`, err.message || err)
      }
    }
    console.log(`[CancelNotifications] ✅ Sent ${sent} courtesy email(s) (skipped ${skipped} with no email on file)`)
  } catch (err: any) {
    console.error(`[CancelNotifications] Unexpected error:`, err.message || err)
  }
}
