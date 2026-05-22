import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org').replace(/\/+$/, '')

export interface ClaimReleasedParams {
  toEmail: string | null
  providerName: string
  leadFullName: string
  leadCity: string
  leadState: string
  leadZip: string
  claimedMinutesAgo: number
  slaMinutes: number
}

/**
 * Notify the original claimer that their claim was auto-released because
 * no outcome was logged within SLA. Lead is back in the pool; they can
 * still re-claim if they want to engage.
 *
 * Tone is direct but not punitive — the first stale-release is usually
 * a forgot-to-mark situation, not bad intent. The threat of pattern-based
 * pause is mentioned without belaboring it.
 */
export async function sendClaimReleasedEmail(p: ClaimReleasedParams): Promise<void> {
  if (!p.toEmail) {
    console.warn(`[notifyClaimReleased] No email on file for ${p.providerName}; cannot notify`)
    return
  }
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[notifyClaimReleased] SENDGRID_API_KEY not set; cannot send')
    return
  }

  const slaHours = Math.round(p.slaMinutes / 60)
  const subject = `Your claim on ${p.leadFullName} (${p.leadCity}, ${p.leadState}) was released back to the pool`

  const text = `Hi ${p.providerName},

A lead you claimed has been auto-released back to the available pool because no outcome was logged within ${slaHours} hours of claiming it.

  Patient:   ${p.leadFullName}
  Location:  ${p.leadCity}, ${p.leadState} ${p.leadZip}
  Claimed:   ${p.claimedMinutesAgo} minutes ago
  SLA:       ${slaHours} hours from claim

What this means:

  • The lead is now visible to other providers in your area. If one of them claims and converts it, that's fine.
  • You can still re-claim it if you have capacity — visit your dashboard.
  • If you tried to reach the patient and they didn't respond, log the outcome (📞 No answer / 📧 Voicemail left / 💬 Text sent / etc.) on the claim page next time. Any outcome counts as engagement and stops auto-release.
  • Repeated auto-releases on your account flag a pattern we review monthly. We'd rather have you engaged with fewer leads than claiming widely and not following up.

Dashboard: ${SITE_URL}/dashboard

If something on our end is blocking you from logging outcomes (a bug, a missing button, anything), reply to this email and I'll look into it.

— Hector
MobilePhlebotomy.org
`

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi ${p.providerName},</p>

<p>A lead you claimed has been auto-released back to the available pool because no outcome was logged within ${slaHours} hours of claiming it.</p>

<pre style="background:#f3f4f6; border:1px solid #e5e7eb; padding:12px 16px; border-radius:6px; font-family:Menlo,Monaco,Consolas,monospace; font-size:13px; color:#1f2937; white-space:pre-wrap;">  Patient:   ${p.leadFullName}
  Location:  ${p.leadCity}, ${p.leadState} ${p.leadZip}
  Claimed:   ${p.claimedMinutesAgo} minutes ago
  SLA:       ${slaHours} hours from claim</pre>

<p><strong>What this means:</strong></p>
<ul>
  <li>The lead is now visible to other providers in your area. If one of them claims and converts it, that's fine.</li>
  <li>You can still re-claim it if you have capacity — visit your <a href="${SITE_URL}/dashboard" style="color:#0066cc;">dashboard</a>.</li>
  <li>If you tried to reach the patient and they didn't respond, log the outcome (📞 No answer / 📧 Voicemail left / 💬 Text sent / etc.) on the claim page next time. Any outcome counts as engagement and stops auto-release.</li>
  <li>Repeated auto-releases on your account flag a pattern we review monthly. We'd rather have you engaged with fewer leads than claiming widely and not following up.</li>
</ul>

<p>If something on our end is blocking you from logging outcomes (a bug, a missing button, anything), reply to this email and I'll look into it.</p>

<p>— Hector<br>
MobilePhlebotomy.org</p>
</body></html>`

  try {
    await sg.send({
      to: p.toEmail,
      from: FROM_EMAIL,
      subject,
      text,
      html,
    })
  } catch (err: any) {
    const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown'
    throw new Error(`SendGrid claim-released email failed: ${msg}`)
  }
}
