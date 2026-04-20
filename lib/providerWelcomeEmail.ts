import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

interface Provider {
  id: string
  name: string
  slug: string
  email: string | null
  claimEmail: string | null
  notificationEmail: string | null
  primaryCity: string | null
  primaryCitySlug: string | null
  primaryState: string | null
  primaryStateSlug: string | null
}

const TIER_LABEL: Record<string, string> = {
  FOUNDING_PARTNER:  'Founding Partner ($49/mo)',
  STANDARD_PREMIUM:  'Standard Premium ($79/mo)',
  HIGH_DENSITY:      'High-Density Metro ($149/mo)',
}

const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const REPLY_TO   = 'hector@mobilephlebotomy.org'
const SITE_URL   = 'https://mobilephlebotomy.org'

/**
 * Sends the paid-tier welcome email to a provider after their subscription
 * becomes active. Idempotent at the call site (webhook gates on
 * customer.subscription.created so it only fires once per subscription).
 *
 * Describes what's live now (Featured placement + priority lead routing)
 * and includes deep links to the provider's own listing on the state page,
 * city page, and detail page so they can verify the upgrade themselves.
 */
export async function sendProviderWelcomeEmail(
  provider: Provider,
  tier: 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY'
): Promise<{ success: boolean; error?: string }> {
  const recipient = provider.notificationEmail || provider.claimEmail || provider.email
  if (!recipient) {
    return { success: false, error: 'No recipient email on provider record' }
  }
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }

  const tierLabel = TIER_LABEL[tier] || tier
  const statePath = provider.primaryStateSlug ? `/us/${provider.primaryStateSlug}` : null
  const cityPath  = provider.primaryCitySlug && provider.primaryStateSlug
    ? `/us/${provider.primaryStateSlug}/${provider.primaryCitySlug}`
    : null
  const detailPath = `/provider/${provider.slug}`

  const isHighDensity = tier === 'HIGH_DENSITY'
  const priorityLine = isHighDensity
    ? 'You\'re on the top priority wave — you\'ll get patient lead notifications first in every ZIP you cover, with a head-start over every other provider.'
    : 'You\'ll now get patient lead notifications with a 10-minute head-start over free providers in your area. Every lead gets emailed (and texted, if you\'ve shared a mobile number) with the patient\'s full contact info, so you can call them directly.'

  const subject = `Welcome to ${tierLabel} — your listing is live`

  const text = `Hi ${provider.name},

Thanks for subscribing to ${tierLabel}. Your upgraded listing is live right now.

What's active:

1. Featured placement on your state page${statePath ? `\n   ${SITE_URL}${statePath}` : ''}
${cityPath ? `2. Featured placement on your city page\n   ${SITE_URL}${cityPath}\n` : ''}3. Priority lead notifications
   ${priorityLine}
4. Your full provider detail page
   ${SITE_URL}${detailPath}

A few practical notes:

- Confirm your profile looks right. If anything is wrong (phone, coverage ZIPs, description, hours), reply to this email and I'll fix it same-day.
- You own your pricing. When leads come in, you call the patient and bill them directly — I don't touch the money or the appointment.
- Cancel anytime. No hard feelings, no questions.

Questions? Just reply. I read every email.

Best,
Hector Valles
MobilePhlebotomy.org`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .hero h1 { margin: 0 0 6px 0; font-size: 22px; }
    .hero p { margin: 0; opacity: 0.95; }
    .benefit { background: #f8f9fa; border-left: 4px solid #667eea; padding: 16px 20px; margin: 12px 0; border-radius: 0 6px 6px 0; }
    .benefit h3 { margin: 0 0 6px 0; font-size: 16px; color: #1f2937; }
    .benefit p { margin: 0; color: #4b5563; font-size: 14px; }
    .benefit a { color: #667eea; text-decoration: none; font-weight: 600; }
    .benefit a:hover { text-decoration: underline; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
    .notes ul { margin: 8px 0 0 0; padding-left: 18px; }
    .notes li { margin: 6px 0; color: #78350f; font-size: 14px; }
    .signoff { margin-top: 24px; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>Welcome to ${tierLabel}</h1>
      <p>Your upgraded listing is live right now — here's what's active.</p>
    </div>

    <p>Hi ${provider.name},</p>
    <p>Thanks for subscribing. Your upgraded listing is live and visible to patients searching your area.</p>

    ${statePath ? `<div class="benefit">
      <h3>1. Featured placement on your state page</h3>
      <p>Premium slot at the top of the state directory.<br>
      <a href="${SITE_URL}${statePath}">View your listing &rarr;</a></p>
    </div>` : ''}

    ${cityPath ? `<div class="benefit">
      <h3>${statePath ? '2' : '1'}. Featured placement on your city page</h3>
      <p>Premium slot on your local city service pages.<br>
      <a href="${SITE_URL}${cityPath}">View your city listing &rarr;</a></p>
    </div>` : ''}

    <div class="benefit">
      <h3>${statePath && cityPath ? '3' : statePath || cityPath ? '2' : '1'}. Priority lead notifications</h3>
      <p>${priorityLine}</p>
    </div>

    <div class="benefit">
      <h3>${statePath && cityPath ? '4' : statePath || cityPath ? '3' : '2'}. Your full provider detail page</h3>
      <p><a href="${SITE_URL}${detailPath}">View your profile &rarr;</a></p>
    </div>

    <div class="notes">
      <strong>A few practical notes:</strong>
      <ul>
        <li><strong>Confirm your profile looks right.</strong> If anything is wrong (phone, coverage ZIPs, description, hours), reply and I'll fix it same-day.</li>
        <li><strong>You own your pricing.</strong> When leads come in, you call the patient and bill them directly — I don't touch the money or the appointment.</li>
        <li><strong>Cancel anytime.</strong> No hard feelings, no questions.</li>
      </ul>
    </div>

    <p>Questions? Just reply. I read every email.</p>

    <div class="signoff">
      Best,<br>
      <strong>Hector Valles</strong><br>
      MobilePhlebotomy.org
    </div>
  </div>
</body>
</html>`

  try {
    await sg.send({
      to: recipient,
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject,
      text,
      html,
    })
    console.log(`[ProviderWelcome] Sent welcome email to ${provider.name} <${recipient}> for tier ${tier}`)
    return { success: true }
  } catch (err: any) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown error'
    console.error(`[ProviderWelcome] Failed to send welcome to ${provider.name}: ${msg}`)
    return { success: false, error: msg }
  }
}
