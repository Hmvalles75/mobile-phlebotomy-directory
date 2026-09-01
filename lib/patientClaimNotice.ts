import sg from '@sendgrid/mail'

// Key set at send time, not module load — see the note in lib/leadConfirmation.ts
// for why the top-level form breaks under tsx.

/**
 * Patient-facing notice, sent the moment a provider claims their request.
 *
 * The submission confirmation (lib/leadConfirmation.ts) already tells the
 * patient to expect a call from an unknown number. This closes the gap that
 * opens afterwards: when a provider claims, the system notifies the claiming
 * provider and sends a courtesy note to the providers who lost it — and tells
 * the patient nothing at all.
 *
 * So the patient submits, hears that someone will call, then sits in silence
 * until an unknown mobile rings. Meanwhile they are usually working down a
 * Google results page. PATIENT_FOUND_OTHER is the fourth most common outcome on
 * record (17), against 31 APPOINTMENT_BOOKED — roughly one patient lost for
 * every two booked, all of them AFTER a provider had claimed and started work.
 *
 * Surfaced by Nawal Isa at Exceptional Mobile Phlebotomy, who claimed two
 * requests 73 and 79 miles away, called immediately, left a voicemail and a
 * text on both, and found the next day that the patient had already booked
 * someone else. She did everything right. Nothing had told her patients she was
 * coming.
 *
 * The single job of this email is to attach a name and a number to the call
 * that is about to arrive, so it reads as the thing they were promised rather
 * than a cold call. Everything else is secondary.
 *
 * Sent only when the lead has an email on file. Leads without one convert at 0%
 * and there is nothing to send to.
 */

const SITE = 'https://mobilephlebotomy.org'
const FROM = 'hector@mobilephlebotomy.org'

export interface PatientClaimNoticeInput {
  leadId: string
  fullName: string
  email?: string | null
  city: string
  state: string
  providerName: string
  /** Public phone if the provider has one. Recognising the number is the point. */
  providerPhone?: string | null
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** (614) 319-0401 from 6143190401; anything unexpected is passed through. */
function formatPhone(raw?: string | null): string | null {
  if (!raw) return null
  const d = String(raw).replace(/\D/g, '')
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return String(raw).trim() || null
}

/**
 * Build the message. Separated from sending so the copy can be rendered and
 * reviewed without a live SendGrid credential.
 */
export function buildPatientClaimNotice(input: PatientClaimNoticeInput): {
  subject: string
  text: string
  html: string
} {
  const firstName = (input.fullName || '').trim().split(/\s+/)[0] || 'there'
  const provider = (input.providerName || '').trim() || 'A local phlebotomist'
  const phone = formatPhone(input.providerPhone)

  const subject = `${provider} is handling your blood draw request`

  const phoneLineText = phone
    ? `Their number is ${phone}, so you'll know it when it rings.`
    : `It will come from a mobile number you don't recognise, so please pick up.`

  const text = `Hi ${firstName},

Good news — ${provider} has accepted your mobile phlebotomy request for ${input.city}, ${input.state} and will be contacting you shortly.

${phoneLineText}

If you miss the call they'll usually leave a voicemail or a text. Calling or texting back is all it takes to get scheduled — you don't need to submit anything again, and you don't need to look for another provider.

They'll confirm timing and pricing with you directly. ${provider} is an independent provider rather than an employee of MobilePhlebotomy.org, so the details are agreed between you and them.

Worth having ready: your doctor's order or lab requisition, if you have one.

If you haven't heard from them by tomorrow, reply to this email and I'll step in.

Hector Valles
MobilePhlebotomy.org
${SITE}`

  const phoneLineHtml = phone
    ? `<strong>Their number is ${escapeHtml(phone)}</strong>, so you'll know it when it rings.`
    : `It will come from <strong>a mobile number you don't recognise</strong>, so please pick up.`

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>Good news — <strong>${escapeHtml(provider)}</strong> has accepted your mobile phlebotomy request for
  <strong>${escapeHtml(input.city)}, ${escapeHtml(input.state)}</strong> and will be contacting you shortly.</p>

  <p style="background:#ecfdf5; padding:16px; border-radius:6px; border-left:4px solid #10b981;">
    ${phoneLineHtml}<br>
    If you miss the call they'll usually leave a voicemail or a text. Calling or texting back is all it takes
    to get scheduled — you don't need to submit anything again, and you don't need to look for another provider.
  </p>

  <p>They'll confirm timing and pricing with you directly. ${escapeHtml(provider)} is an independent provider
  rather than an employee of MobilePhlebotomy.org, so the details are agreed between you and them.</p>

  <p>Worth having ready: your doctor's order or lab requisition, if you have one.</p>

  <p>If you haven't heard from them by tomorrow, just reply to this email and I'll step in.</p>

  <p style="margin-bottom:0;"><strong>Hector Valles</strong><br>
  <a href="${SITE}" style="color:#2563eb;">MobilePhlebotomy.org</a></p>
</div>`

  return { subject, text, html }
}

export async function sendPatientClaimNotice(
  input: PatientClaimNoticeInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.email) {
    console.log(`[Lead ${input.leadId}] no patient email on file — claim notice skipped`)
    return { success: false, error: 'no email on file' }
  }

  const key = process.env.SENDGRID_API_KEY
  if (!key) return { success: false, error: 'SENDGRID_API_KEY not configured' }

  const { subject, text, html } = buildPatientClaimNotice(input)

  try {
    sg.setApiKey(key)
    await sg.send({
      to: input.email,
      from: { email: FROM, name: 'MobilePhlebotomy.org' },
      replyTo: FROM,
      subject,
      text,
      html,
    })
    console.log(`[Lead ${input.leadId}] patient claim notice sent to ${input.email}`)
    return { success: true }
  } catch (error: any) {
    const detail =
      error?.response?.body?.errors?.[0]?.message || error?.message || String(error)
    console.error(`[Lead ${input.leadId}] patient claim notice FAILED:`, detail)
    return { success: false, error: String(detail).slice(0, 500) }
  }
}
