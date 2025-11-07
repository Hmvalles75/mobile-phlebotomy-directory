import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

type Send = (to: string, subject: string, text: string) => Promise<void>

const send: Send = async (to, subject, text) => {
  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('[providerEmails] LEAD_EMAIL_FROM env var not set')
    return
  }

  try {
    await sg.send({
      to,
      from: process.env.LEAD_EMAIL_FROM,
      subject,
      text
    })
    console.log(`[providerEmails] Sent to ${to}: ${subject}`)
  } catch (error: any) {
    console.error('[providerEmails] Failed to send email:', error.response?.body || error.message)
  }
}

export async function emailClaimReceipt(to: string, providerName: string, verifyUrl: string) {
  return send(
    to,
    'Confirm your provider listing',
    `Hi ${providerName || ''},

Thanks for claiming your listing on MobilePhlebotomy.org.

Please verify ownership:
${verifyUrl}

Once verified, set your ZIP coverage, add a phone for SMS leads, and purchase lead credits to start receiving referrals.

— MobilePhlebotomy.org`
  )
}

export async function emailVerifiedWelcome(to: string) {
  const dashboardUrl = `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard/login`

  return send(
    to,
    'You are verified — Access your dashboard',
    `Congratulations! You are now a VERIFIED provider on MobilePhlebotomy.org

Your account is active and ready to receive patient leads.

ACCESS YOUR DASHBOARD:
${dashboardUrl}

Enter your email (${to}) to receive a secure login link.

Next steps:
1) Log in to your dashboard
2) Add your service ZIP codes
3) Purchase lead credits to start receiving referrals

Tip: STAT (urgent) leads typically convert fastest and pay more per lead.

Questions? Reply to this email or contact support@mobilephlebotomy.org

— MobilePhlebotomy.org`
  )
}

export async function emailCreditsDepleted(to: string, dashboardUrl: string) {
  return send(
    to,
    'You are out of lead credits',
    `Heads up — your lead credits are 0.

Buy more here to keep receiving leads:
${dashboardUrl}

We will hold incoming leads for 48 hours.

— MobilePhlebotomy.org`
  )
}

export async function emailFeaturedActive(to: string, tier: string) {
  return send(
    to,
    `Featured listing activated (${tier})`,
    `Your Featured listing is live.

You will appear above non-featured providers where you are verified and covered. Keep credits loaded for real-time leads.

Manage your listing:
${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard

— MobilePhlebotomy.org`
  )
}

export async function emailNewLead(to: string, leadDetails: {
  patientName: string
  patientPhone: string
  city: string
  state: string
  zip: string
  urgency: string
  notes?: string
}) {
  const { patientName, patientPhone, city, state, zip, urgency, notes } = leadDetails

  return send(
    to,
    `New ${urgency} lead: ${city}, ${state}`,
    `New patient lead ready for contact:

Patient: ${patientName}
Phone: ${patientPhone}
Location: ${city}, ${state} ${zip}
Urgency: ${urgency}
${notes ? `Notes: ${notes}` : ''}

Contact this patient ASAP to schedule their appointment.

View dashboard:
${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard

— MobilePhlebotomy.org`
  )
}

export async function emailLeadCreditLow(to: string, creditsRemaining: number, dashboardUrl: string) {
  return send(
    to,
    'Lead credits running low',
    `You have ${creditsRemaining} lead credit${creditsRemaining === 1 ? '' : 's'} remaining.

Top up now to continue receiving leads:
${dashboardUrl}

— MobilePhlebotomy.org`
  )
}
