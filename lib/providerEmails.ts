import sg from '@sendgrid/mail'

type Send = (to: string, subject: string, text: string) => Promise<void>

const send: Send = async (to, subject, text) => {
  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('[providerEmails] LEAD_EMAIL_FROM env var not set')
    return
  }

  // Set API key at send time (not import time) for script compatibility
  sg.setApiKey(process.env.SENDGRID_API_KEY!)

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

Your listing for ${businessName} is approved and now live on MobilePhlebotomy.org.

If you want to receive patient requests in your area, you need to activate dispatch here (takes ~60 seconds):
👉 https://www.mobilephlebotomy.org/onboard

Once activated, you'll:

Get notified when a matching request comes in

Confirm availability by replying YES/NO

Only pay when a visit is completed (no subscription)

If you prefer to remain directory-only, you don't need to do anything.

Best,
Hector
MobilePhlebotomy.org

P.S. Our emails can land in spam at first — please mark as Not Spam so you don't miss requests.`
  )
}

// New personalized email based on form lead opt-in choice
export async function emailProviderApprovedWithLeadChoice(
  to: string,
  businessName: string,
  contactName: string,
  leadOptIn: string | null | undefined,
  contactMethods: string | null | undefined
) {
  const firstName = contactName.split(' ')[0]

  // Parse contact methods
  const methods = contactMethods?.split(',').map(m => m.trim()) || []
  const wantsSMS = methods.includes('sms')
  const wantsEmail = methods.includes('email')

  // Build contact method string
  let methodStr = ''
  if (wantsSMS && wantsEmail) {
    methodStr = 'SMS and email'
  } else if (wantsSMS) {
    methodStr = 'SMS'
  } else if (wantsEmail) {
    methodStr = 'email'
  }

  // OPTED IN for leads
  if (leadOptIn === 'yes') {
    return send(
      to,
      `You're all set to receive leads — ${businessName}`,
      `Hi ${firstName},

Great news! Your listing for ${businessName} is now live on MobilePhlebotomy.org, and you're all set to receive patient leads.

✅ WHAT HAPPENS NEXT:
When a patient in your area requests mobile phlebotomy services, we'll notify you via ${methodStr || 'email'}.

You'll receive the patient's:
• Name and phone number
• Location (city, state, ZIP)
• Urgency level
• Any special notes

📱 HOW TO RESPOND:
Simply contact the patient directly to schedule their appointment. The faster you respond, the better your chances of booking the visit.

💰 PRICING:
During our beta phase, all leads are FREE. We're working with a small group of providers to refine the system before introducing pricing.

📬 IMPORTANT:
Our emails can land in spam at first. Please check your spam folder and mark us as "Not Spam" so you don't miss patient requests.

Questions? Just reply to this email.

Best,
Hector
MobilePhlebotomy.org`
    )
  }

  // OPTED OUT of leads (listing only)
  if (leadOptIn === 'no') {
    return send(
      to,
      'Your MobilePhlebotomy.org listing is live',
      `Hi ${firstName},

Your listing for ${businessName} is now live on MobilePhlebotomy.org.

Patients searching for mobile phlebotomy in your area can now find your business in our directory.

📋 DIRECTORY ONLY:
As you requested, we won't send you patient leads. Your listing will remain visible to patients who can contact you directly through the information on your profile.

💡 CHANGE YOUR MIND?
If you ever want to start receiving patient requests, you can activate lead notifications here:
👉 https://www.mobilephlebotomy.org/onboard

Best,
Hector
MobilePhlebotomy.org`
    )
  }

  // NO PREFERENCE SET (old submission) - use original email
  return emailProviderApproved(to, businessName, contactName)
}

export async function emailOnboardingFollowUp(to: string, businessName: string, contactName: string) {
  // Extract first name from contact name (e.g., "John Doe" -> "John")
  const firstName = contactName.split(' ')[0]

  return send(
    to,
    'Quick question — should I send you leads?',
    `Hi ${firstName}, quick one:

Do you want to receive patient requests from MobilePhlebotomy.org in your area?

If yes, activate here:
👉 https://www.mobilephlebotomy.org/onboard

If not, no worries — your listing stays live in the directory either way.

Best,
Hector`
  )
}

// Outreach email to providers in areas with unserved leads
export async function emailLeadOutreach(
  to: string,
  businessName: string,
  state: string,
  recentLeadCount: number
) {
  const stateNames: Record<string, string> = {
    'OH': 'Ohio', 'PA': 'Pennsylvania', 'MI': 'Michigan', 'KY': 'Kentucky',
    'FL': 'Florida', 'IL': 'Illinois', 'CA': 'California', 'NY': 'New York',
    'TX': 'Texas', 'NC': 'North Carolina', 'IN': 'Indiana', 'NJ': 'New Jersey'
  }
  const stateName = stateNames[state] || state

  return send(
    to,
    `Patients in ${stateName} are looking for mobile phlebotomy`,
    `Hi,

I'm reaching out because we have patients in ${stateName} requesting mobile phlebotomy services, and ${businessName} is listed in our directory.

In the past 30 days, we've received ${recentLeadCount} patient requests in ${stateName} — but we don't have enough providers signed up to receive them.

Would you like to receive these patient requests? It's free during our beta.

Here's how it works:
• Patient submits request on MobilePhlebotomy.org
• You get notified via email/SMS with their contact info
• You reach out directly to schedule the appointment
• No subscription, no fees during beta

If interested, activate lead notifications here (takes 60 seconds):
👉 https://www.mobilephlebotomy.org/onboard

If you're not taking new patients right now, no worries — your directory listing stays active either way.

Best,
Hector
MobilePhlebotomy.org

P.S. Reply to this email if you have any questions.`
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

// Website service outreach email for providers without websites
export async function emailWebsiteServiceOutreach(
  to: string,
  businessName: string
) {
  return send(
    to,
    `Professional website for ${businessName} - special offer`,
    `Hi,

I noticed that ${businessName} is listed on MobilePhlebotomy.org but doesn't have a dedicated website yet.

Having a professional website (beyond just social media) can help you:
• Rank higher in Google when patients search for mobile phlebotomy
• Look more professional and trustworthy to potential patients
• Give patients an easy way to book appointments
• Provide a link for your Google Business profile and business cards

We're now offering a website service for providers in our directory:

📦 WEBSITE SETUP - $199 (one-time)
• Custom page at mobilephlebotomy.org/p/yourname
• Professional, mobile-friendly design
• Online booking integration
• Contact form with email notifications
• SEO optimized for local search

➕ OPTIONAL HOSTING - $19/month
• Secure hosting included
• Content updates on request
• Analytics & visitor tracking

See an example: https://www.mobilephlebotomy.org/p/carewithluvs

If you're interested, just reply to this email and we can discuss your needs.

Best,
Hector
MobilePhlebotomy.org

P.S. No pressure at all — your free directory listing stays active either way.`
  )
}
