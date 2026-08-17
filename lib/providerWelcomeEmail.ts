import sg from '@sendgrid/mail'

// Set the key at send time, not module load — same reasoning as
// lib/leadConfirmation.ts. Top-level setApiKey works under Next.js but breaks
// in tsx scripts, where ES imports are hoisted above dotenv.config(): the key
// reads undefined, setApiKey never fires, and SendGrid rejects the empty auth
// header with "Permission denied, wrong credentials" — indistinguishable from
// a revoked key.

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

// Updated 2026-04-24 for the two-tier public structure.
// Note Charter Member is internal-only but labeled for the rare case this
// welcome email fires for a grandfathered pilot's conversion.
const TIER_LABEL: Record<string, string> = {
  CHARTER_MEMBER:    'Charter Member ($49/mo)',
  FOUNDING_PARTNER:  'Founding Partner ($79/mo)',
  STANDARD_PREMIUM:  'Standard Premium ($79/mo)',
  HIGH_DENSITY:      'Metro Pro ($149/mo)',
}

const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const REPLY_TO   = 'hector@mobilephlebotomy.org'
const SITE_URL   = 'https://mobilephlebotomy.org'

/**
 * Sends the paid-tier welcome email to a provider after their subscription
 * becomes active. Idempotent at the call site (webhook gates on
 * customer.subscription.created so it only fires once per subscription).
 *
 * Describes what's live now (Featured placement; routing priority arrives
 * with the waterfall) and includes deep links to the provider's own listing,
 * city page, and detail page so they can verify the upgrade themselves.
 *
 * `overrideTo` replaces the usual notificationEmail-first resolution. Use it
 * when the person who actually paid isn't the address leads route to — the
 * billing contact should hear about their own upgrade.
 */
export async function sendProviderWelcomeEmail(
  provider: Provider,
  tier: 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY' | 'CHARTER_MEMBER',
  overrideTo?: string | string[]
): Promise<{ success: boolean; error?: string }> {
  const recipient = overrideTo || provider.notificationEmail || provider.claimEmail || provider.email
  if (!recipient || (Array.isArray(recipient) && recipient.length === 0)) {
    return { success: false, error: 'No recipient email on provider record' }
  }
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return { success: false, error: 'SENDGRID_API_KEY not configured' }
  }
  sg.setApiKey(apiKey)

  const tierLabel = TIER_LABEL[tier] || tier
  const statePath = provider.primaryStateSlug ? `/us/${provider.primaryStateSlug}` : null
  const cityPath  = provider.primaryCitySlug && provider.primaryStateSlug
    ? `/us/${provider.primaryStateSlug}/${provider.primaryCitySlug}`
    : null
  const detailPath = `/provider/${provider.slug}`

  // The head start is real again as of 2026-08-14 (see PAID_HEAD_START_SECONDS
  // in lib/leadNotifications.ts and the matching gate in the dashboard route).
  // It is claimable in both places — email AND the dashboard queue — which is
  // what it was missing the first time round. Say what we deliver and no more:
  // ten minutes, standard requests only, and nothing at all on urgent ones.
  const priorityLine = "Top placement in your city's directory, a larger profile card, your Founding Partner badge, and a 10-minute head start on new patient requests — standard requests reach you before free listings see them, by email and on your dashboard. Urgent requests still go to everyone at once; we won't hold back a patient who needs someone the same day."

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
- Send me a photo. Reply with a headshot or your logo and I'll add it to your listing card. Several providers have done this — a card with a face or a logo on it reads very differently from a plain one.
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
        <li><strong>Send me a photo.</strong> Reply with a headshot or your logo and I'll add it to your listing card. Several providers have done this &mdash; a card with a face or a logo on it reads very differently from a plain one.</li>
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
    const shown = Array.isArray(recipient) ? recipient.join(', ') : recipient
    console.log(`[ProviderWelcome] Sent welcome email to ${provider.name} <${shown}> for tier ${tier}`)
    return { success: true }
  } catch (err: any) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown error'
    console.error(`[ProviderWelcome] Failed to send welcome to ${provider.name}: ${msg}`)
    return { success: false, error: msg }
  }
}
