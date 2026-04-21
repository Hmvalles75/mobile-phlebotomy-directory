import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

const ADMIN_EMAIL = 'hector@mobilephlebotomy.org'
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'

interface HighValueLeadPayload {
  id: string
  fullName: string
  phone: string
  email: string | null
  city: string
  state: string
  zip: string
  urgency: string
  notes: string | null
  drawCount: string | null
  requestType: string | null
  organizationName: string | null
  timeframe: string | null
  estimatedValueCents: number
}

function formatDollars(cents: number): string {
  if (!cents || cents <= 0) return '$0'
  return `$${(cents / 100).toLocaleString()}`
}

/**
 * Sends an immediate admin-only notification when a high-value lead lands
 * (group draw of 6+ OR organization/business requester). Fires independently
 * of the normal Featured/SMS routing so group leads always get human follow-up
 * attention even if they get auto-routed to a provider.
 *
 * Fire-and-forget from the caller's perspective — errors are caught there.
 */
export async function notifyHighValueLead(lead: HighValueLeadPayload): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[HighValueLead] SENDGRID_API_KEY not set, skipping admin notification')
    return
  }

  const subjectName = lead.organizationName || lead.fullName
  const subject = `🚨 High-Value Lead — ${subjectName} — ${lead.city}, ${lead.state}`

  const lines = [
    `A high-value lead just came in. Follow up manually in addition to the normal routing.`,
    ``,
    `--- LEAD SUMMARY ---`,
    `Lead ID:              ${lead.id}`,
    `Estimated value:      ${formatDollars(lead.estimatedValueCents)}`,
    `Draw count:           ${lead.drawCount || '(unspecified)'}`,
    `Request type:         ${lead.requestType || '(unspecified)'}`,
    lead.organizationName ? `Organization:         ${lead.organizationName}` : null,
    lead.timeframe ? `Timeframe:            ${lead.timeframe}` : null,
    ``,
    `--- CONTACT ---`,
    `Name:                 ${lead.fullName}`,
    `Phone:                ${lead.phone}`,
    `Email:                ${lead.email || '(none)'}`,
    `Location:             ${lead.city}, ${lead.state} ${lead.zip}`,
    `Urgency:              ${lead.urgency}`,
    lead.notes ? `Notes:                ${lead.notes}` : null,
    ``,
    `Admin: https://mobilephlebotomy.org/admin`,
  ].filter(Boolean).join('\n')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; }
    .container { max-width: 640px; margin: 0 auto; padding: 20px; }
    .hero { background: linear-gradient(135deg, #b45309 0%, #d97706 100%); color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .hero h2 { margin: 0 0 6px 0; }
    .estimated { font-size: 28px; font-weight: 700; color: #78350f; margin-top: 4px; }
    dl { margin: 0; }
    dt { font-weight: 600; color: #4b5563; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 12px; }
    dd { margin: 2px 0 0 0; font-size: 15px; color: #111827; }
    .section { background: #f9fafb; border-left: 4px solid #d97706; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 12px 0; }
    a.btn { display: inline-block; background: #0ea5e9; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h2>🚨 High-Value Lead</h2>
      <div>${subjectName} — ${lead.city}, ${lead.state}</div>
      <div class="estimated" style="color: #fff;">${formatDollars(lead.estimatedValueCents)} est. value</div>
    </div>

    <div class="section">
      <dl>
        <dt>Draw count</dt><dd>${lead.drawCount || '(unspecified)'}</dd>
        <dt>Request type</dt><dd>${lead.requestType || '(unspecified)'}</dd>
        ${lead.organizationName ? `<dt>Organization</dt><dd>${lead.organizationName}</dd>` : ''}
        ${lead.timeframe ? `<dt>Timeframe</dt><dd>${lead.timeframe}</dd>` : ''}
      </dl>
    </div>

    <div class="section">
      <dl>
        <dt>Contact</dt><dd>${lead.fullName}</dd>
        <dt>Phone</dt><dd><a href="tel:${lead.phone}">${lead.phone}</a></dd>
        <dt>Email</dt><dd>${lead.email ? `<a href="mailto:${lead.email}">${lead.email}</a>` : '(none)'}</dd>
        <dt>Location</dt><dd>${lead.city}, ${lead.state} ${lead.zip}</dd>
        <dt>Urgency</dt><dd>${lead.urgency}</dd>
        ${lead.notes ? `<dt>Notes</dt><dd>${lead.notes}</dd>` : ''}
      </dl>
    </div>

    <a class="btn" href="https://mobilephlebotomy.org/admin">Open admin panel →</a>

    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
      Lead ID: ${lead.id}
    </p>
  </div>
</body>
</html>`

  await sg.send({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    replyTo: ADMIN_EMAIL,
    subject,
    text: lines,
    html,
  })
  console.log(`[HighValueLead] Sent admin notification for ${lead.id} (${formatDollars(lead.estimatedValueCents)})`)
}
