import { prisma } from './prisma'
import { freeTierDelaySeconds } from './leadNotifications'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Called after a lead is successfully claimed. Two responsibilities:
 *
 *   1. Cancel any still-scheduled SendGrid sends for this lead's batch.
 *      Wave 2 emails (see freeTierDelaySeconds — currently 30 minutes for
 *      non-paying providers on STANDARD leads) are queued at SendGrid until
 *      their sendAt fires. If the lead gets claimed within that window, we
 *      cancel the batch so those emails never go out — preserving the paying
 *      customer's first-bid window in practice, not just in theory.
 *
 *   2. Send a brief courtesy "lead claimed" email, but ONLY to providers who
 *      genuinely received the original before the claim. Tells them not to
 *      waste time on a dead claim link.
 *
 *      Whether a provider received it cannot be read off `status`: step 1
 *      cancels sends that are already marked SENT. Delivery time is therefore
 *      reconstructed per notification from the wave rule the sender used.
 *      Getting this wrong is not cosmetic — it emails providers about leads
 *      they were never shown, which reads as taunting and generated two
 *      support complaints from one provider.
 *
 * Best-effort — failures here don't block the claim. Logged and swallowed.
 */
export async function cancelLeadNotifications(leadId: string, claimingProviderId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true, city: true, state: true, zip: true,
        urgency: true,
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

    // ── Step 2: Courtesy email to providers who ACTUALLY received the lead ──
    //
    // `status` cannot answer this. A Wave 2 row is marked SENT the instant it
    // is handed to SendGrid with a future sendAt, so a notification that was
    // cancelled in step 1 — and therefore never delivered — still reads SENT.
    // Emailing on that basis tells a provider they lost a race they were never
    // entered in. Resolute Mobile lab asked twice why leads "don't show up";
    // 6 of her 31 notifications were cancelled before delivery and she was
    // told about every one of them.
    //
    // So reconstruct delivery time per notification using the same rule the
    // sender applied: Wave 1 (priorityRouting) went immediately, Wave 2 was
    // held by freeTierDelaySeconds(). Anything whose delivery time had not
    // arrived by the moment of the claim was never seen.
    const notifications = await prisma.leadNotification.findMany({
      where: {
        leadId: lead.id,
        status: { in: ['SENT', 'QUEUED'] },
      },
      select: {
        providerId: true,
        createdAt: true,
        provider: {
          select: {
            name: true, priorityRouting: true,
            notificationEmail: true, claimEmail: true, email: true,
          },
        },
      },
    })

    // The delay depends on whether a paying provider was in the batch, which
    // is judged across ALL notified providers including the claimer.
    const payingInBatch = notifications.filter(n => n.provider.priorityRouting).length
    const otherDelaySeconds = freeTierDelaySeconds(payingInBatch, lead.urgency)
    const claimedAt = Date.now()

    const delivered = notifications.filter(n => {
      if (n.providerId === claimingProviderId) return false
      const delaySeconds = n.provider.priorityRouting ? 0 : otherDelaySeconds
      const deliveryTime = n.createdAt.getTime() + delaySeconds * 1000
      return deliveryTime <= claimedAt
    })

    const suppressed = notifications.length - delivered.length - 1  // -1 = claimer
    if (suppressed > 0) {
      console.log(
        `[CancelNotifications] Suppressed ${suppressed} courtesy email(s) — ` +
        `those notifications were cancelled before delivery (Wave 2, ${otherDelaySeconds}s window)`
      )
    }

    if (delivered.length === 0) {
      console.log(`[CancelNotifications] No providers received the original before the claim`)
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
    for (const n of delivered) {
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
