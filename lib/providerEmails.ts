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

📬 Note: Check your spam/junk folder if you don't see our emails. Mark as "Not Spam" to receive all lead notifications.

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

export async function emailProviderApproved(to: string, businessName: string, contactName: string) {
  // Extract first name from contact name (e.g., "John Doe" -> "John")
  const firstName = contactName.split(' ')[0]

  return send(
    to,
    'Your MobilePhlebotomy.org listing is live',
    `Hi ${firstName},

Thanks for submitting ${businessName} to MobilePhlebotomy.org — your listing has been approved and is now live in the directory.

At this stage, there's nothing you need to do. Your business is visible to patients searching in your area.

If you'd like to access the optional provider dashboard (to review requests, manage coverage, or receive notifications), you'll first need to complete onboarding here:
👉 https://www.mobilephlebotomy.org/onboard

Once onboarding is complete, you'll be able to access your dashboard using a secure magic link.

Email notifications for patient requests are currently limited to a small group of featured providers while we refine routing and volume.

If anything needs updating on your listing, feel free to reply to this email.

📬 Note: Our emails may land in your spam/junk folder initially. Please mark us as "Not Spam" to ensure you receive future updates.

Best,
Hector
MobilePhlebotomy.org`
  )
}

export async function emailFeaturedProviderWelcome(to: string, providerName: string, contactName: string, metros: string[]) {
  // Extract first name from contact name
  const firstName = contactName.split(' ')[0]

  // Format metro list
  const metroList = metros.length > 0
    ? metros.map(m => `  • ${m}`).join('\n')
    : '  • Your coverage area'

  return send(
    to,
    'Welcome to Featured Provider Status',
    `Hi ${firstName},

Great news! ${providerName} has been upgraded to Featured Provider status on MobilePhlebotomy.org.

🌟 WHAT THIS MEANS FOR YOU:

Premium Placement
  ✓ Featured section at the top of all your coverage pages
  ✓ Displayed above non-featured providers
  ✓ Eye-catching "Featured Provider" badge
  ✓ Professional logo and profile image display

Real-Time Lead Notifications
  ✓ Instant email alerts when patients submit requests in your area
  ✓ Get patient contact info immediately (name, phone, location)
  ✓ First-mover advantage to contact patients quickly
  ✓ All leads are FREE during our beta period

Enhanced Visibility
  ✓ Prominent display on metro and state pages
  ✓ Increased patient exposure and inquiries
  ✓ Professional presentation with verified badge

📍 YOUR FEATURED COVERAGE:
${metroList}

📧 LEAD NOTIFICATIONS:
We'll send you email notifications for all patient requests in your service area. Make sure to:
  • Check your spam folder and mark us as "Not Spam"
  • Monitor ${to} regularly for new leads
  • Respond quickly to maximize conversions

🎯 BETA PRICING:
During our beta phase, all patient leads are completely FREE. There are no charges for:
  • Lead notifications
  • Patient contact information
  • Featured placement
  • Premium visibility

We're working with a small group of featured providers to refine our lead routing and volume before expanding the program.

💡 NEXT STEPS:
1. Start receiving lead notifications (already active!)
2. Respond quickly when you receive patient requests
3. Provide excellent service to build your reputation

📊 OPTIONAL - PROVIDER DASHBOARD:
If you'd like to access the optional provider dashboard, complete onboarding here:
👉 https://www.mobilephlebotomy.org/onboard

The dashboard allows you to:
  • View your lead history
  • Manage your coverage areas
  • Update your profile information

Questions or need help? Just reply to this email.

Thanks for being an early Featured Provider!

Best,
Hector
MobilePhlebotomy.org

---
📬 Note: Lead notifications may land in your spam folder initially. Please mark as "Not Spam" to receive all patient requests.`
  )
}
