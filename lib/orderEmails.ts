import { sendTransactionalEmail, VERIFIED_SENDER } from './sendTransactionalEmail'
import { SITE_URL } from './seo'

/**
 * Emails for a client-portal order submission (2026-10-10).
 *
 * Both are deliberately thin. Orders carry PHI (name, address, phone,
 * accommodation notes) and these go out over SendGrid to Gmail and to the
 * client's mailbox, so the body holds the participant's FIRST NAME, city and
 * state, the requested window, and a link. Address, phone, email, caregiver
 * details and notes never leave the database by this route; the admin link
 * is where the full record lives.
 *
 * Both return the error string from sendTransactionalEmail (null on success)
 * so the caller can record a failure without blocking the order.
 */
const SITE = (process.env.PUBLIC_SITE_URL || SITE_URL).replace(/\/+$/, '')
export const ADMIN_ORDER_INBOX = 'hector@mobilephlebotomy.org'

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim()
}

export interface OrderEmailInput {
  orderId: string
  publicShareToken: string
  clientName: string
  participantName: string
  city: string
  state: string
  requestedWindow: string | null
  submitterEmail: string
}

export async function sendNewOrderAdminEmail(o: OrderEmailInput): Promise<string | null> {
  const first = firstNameOf(o.participantName)
  const adminUrl = `${SITE}/admin/institutional/orders/${o.orderId}`
  const text = `New order from ${o.clientName}

Participant: ${first}
Location: ${o.city}, ${o.state}
Preferred days and times: ${o.requestedWindow || 'not given'}
Submitted by: ${o.submitterEmail}

Review, set the rate and assign a provider:
${adminUrl}
`
  return sendTransactionalEmail({
    to: ADMIN_ORDER_INBOX,
    subject: `New order: ${o.clientName}, ${first} in ${o.city}, ${o.state}`,
    text,
  })
}

export async function sendOrderReceivedEmail(o: OrderEmailInput): Promise<string | null> {
  const first = firstNameOf(o.participantName)
  const trackUrl = `${SITE}/orders/${o.publicShareToken}`
  const text = `Order received

Thank you. We have your order for ${first} in ${o.city}, ${o.state}. We will confirm the appointment details by email.

You can follow this order here:
${trackUrl}

MobilePhlebotomy.org
${VERIFIED_SENDER}
`
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#1f2937; line-height:1.6;">
  <h2 style="color:#0f766e;">Order received</h2>
  <p>Thank you. We have your order for <strong>${first}</strong> in ${o.city}, ${o.state}. We will confirm the appointment details by email.</p>
  <p style="margin:24px 0;"><a href="${trackUrl}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Track this order</a></p>
  <p style="color:#9ca3af;font-size:12px;">MobilePhlebotomy.org · ${VERIFIED_SENDER}</p>
</div>`
  return sendTransactionalEmail({
    to: o.submitterEmail,
    subject: `Order received: ${first} in ${o.city}, ${o.state}`,
    text,
    html,
  })
}
