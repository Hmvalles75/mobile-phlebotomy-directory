/**
 * Institutional lead gate.
 *
 * A request flagged high-value (20+ draws, an organization/business request
 * type, or research/B2B vocabulary in the notes) is not a patient looking for
 * a phlebotomist. It is a lab, a study, an employer, or an event, and what it
 * needs is a written proposal from us: day-rate staffing, a certificate of
 * insurance, one invoice. Sent through the provider fan-out it becomes a solo
 * phlebotomist quoting a lab company cold, which is how the Gift of Life
 * request was lost at a $500 quote and how a $1,500 Mass Eye and Ear job
 * went to a competitor at ten times the price. See PRICING-RATE-CARD.md.
 *
 * On 2026-09-09 Vibrant Wellness asked for event staffing for ~50 attendees
 * in Santa Clara. The lead was flagged high-value, the admin email fired, and
 * it still went to four providers; one claimed it and emailed the client his
 * own terms within the hour. Eleven high-value leads had reached the
 * database by then; five were fanned out, three claimed by providers.
 *
 * The gate: such a lead is created as INSTITUTIONAL_REVIEW, never routed,
 * never claimable (claim requires OPEN), invisible to provider dashboards,
 * never auto-expired. The requester gets an acknowledgment that a written
 * proposal is coming from us; the admin gets the existing high-value email
 * plus an SMS. If it turns out to be an ordinary patient, the admin lead page
 * has a one-click "Release to providers" that flips it to OPEN and routes it.
 */
import sg from '@sendgrid/mail'

const FROM = 'hector@mobilephlebotomy.org'

export interface InstitutionalAckInput {
  id: string
  fullName: string
  email: string | null
  city: string
  state: string
  organizationName?: string | null
}

export function buildInstitutionalAcknowledgment(lead: InstitutionalAckInput): { subject: string; text: string } {
  const first = (lead.fullName || '').trim().split(/\s+/)[0] || 'there'
  const subject = `Your phlebotomy staffing request for ${lead.city}, ${lead.state}`
  const text = `Hi ${first},

Thanks for your request. Because it involves more than a single patient draw, I handle it directly rather than passing it to an individual phlebotomist, so you get one proposal, one certificate of insurance and one point of contact.

I'll come back to you in writing within one business day with pricing, staffing, and what we bring versus what you supply. If there are details that would help me quote accurately, such as the date, hours, venue, and number of people, reply to this email and include them.

Hector Valles
Mobile Phlebotomy Management LLC
MobilePhlebotomy.org`
  return { subject, text }
}

export async function sendInstitutionalAcknowledgment(lead: InstitutionalAckInput): Promise<boolean> {
  if (!lead.email) {
    console.log(`[Lead ${lead.id}] Institutional lead has no email on file; no acknowledgment sent`)
    return false
  }
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.error('[Institutional ack] SendGrid not configured')
    return false
  }
  sg.setApiKey(apiKey)
  const { subject, text } = buildInstitutionalAcknowledgment(lead)
  try {
    await sg.send({ to: lead.email, from: FROM, replyTo: FROM, subject, text })
    console.log(`[Lead ${lead.id}] Institutional acknowledgment sent to ${lead.email}`)
    return true
  } catch (error: any) {
    console.error(`[Lead ${lead.id}] Institutional acknowledgment failed:`, error?.response?.body || error?.message || error)
    return false
  }
}
