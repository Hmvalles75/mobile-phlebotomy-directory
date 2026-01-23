import { prisma } from '../lib/prisma'
import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

async function send(to: string, subject: string, text: string) {
  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('LEAD_EMAIL_FROM env var not set')
    return
  }

  try {
    await sg.send({
      to,
      from: process.env.LEAD_EMAIL_FROM,
      subject,
      text
    })
    console.log(`✅ Email sent to ${to}`)
  } catch (error: any) {
    console.error('Failed to send email:', error.response?.body || error.message)
    throw error
  }
}

/**
 * Send ProStik Solutions a custom onboarding email explaining
 * why they need to complete their profile setup to appear on metro pages
 */
async function sendProStikOnboarding() {
  console.log('🔍 Finding ProStik Solutions...\n')

  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'ProStik' } },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      claimToken: true,
      claimVerifiedAt: true,
      status: true,
      slug: true,
      coverage: true,
      isFeatured: true,
      isFeaturedCity: true
    }
  })

  if (!provider) {
    console.log('❌ ProStik Solutions not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found: ${provider.name}`)
  console.log(`   Email: ${provider.email}`)
  console.log(`   Status: ${provider.status}`)
  console.log(`   Claim Verified: ${provider.claimVerifiedAt ? 'Yes' : 'No'}`)
  console.log(`   Featured: ${provider.isFeatured ? 'Yes' : 'No'}`)
  console.log(`   Featured City: ${provider.isFeaturedCity ? 'Yes' : 'No'}`)
  console.log()

  if (provider.claimVerifiedAt) {
    console.log('⚠️  Provider has already completed onboarding!')
    console.log('   Claim verified at:', provider.claimVerifiedAt)
    await prisma.$disconnect()
    return
  }

  if (!provider.email) {
    console.log('❌ No email address found for this provider')
    await prisma.$disconnect()
    return
  }

  console.log('📧 Sending onboarding email...\n')

  const onboardUrl = `https://www.mobilephlebotomy.org/onboard`

  try {
    await send(
      provider.email,
      'Complete Your ProStik Solutions Profile on MobilePhlebotomy.org',
      `Hi there,

Your business, **ProStik Solutions**, is currently listed on MobilePhlebotomy.org and has been selected for **Featured Provider** placement in the Detroit metro area.

### Why You're Receiving This Email

We've set up ProStik Solutions as a featured provider for Detroit-area mobile phlebotomy searches. However, to appear on our metro directory pages (like /us/metro/detroit) and receive automated lead notifications, you need to complete your provider profile setup.

### What You Need to Do

**Complete your onboarding here:** ${onboardUrl}

This quick process (5-10 minutes) allows you to:

1. **Set your service coverage areas** — Define exactly which cities and zip codes you serve
2. **Configure lead notifications** — Get instant SMS/email alerts when patients request service in your area
3. **Update your profile details** — Add your logo, description, services, and contact info
4. **Start receiving qualified leads** — Patients in your area will be able to request blood draws through the platform

### Why This Matters

Right now, your listing is **not appearing** on our general metro pages because you haven't defined your coverage areas. Once you complete onboarding:

- Your business will appear when Detroit-area patients search for mobile phlebotomy
- You'll receive real-time notifications when patients submit requests in your service area
- You can reply via SMS/email with simple keywords (CLAIMED, BOOKED, COMPLETED, etc.) to track lead status
- Your featured placement gives you **priority visibility** over other providers

### Your Profile URL

Once you complete onboarding, your enhanced profile will be live at:
**https://www.mobilephlebotomy.org/provider/${provider.slug}**

### How Lead Notifications Work

After onboarding, you'll receive instant notifications like this:

**SMS Example:**
\`\`\`
🔔 New Lead #abc123
John Doe, ZIP 48126
URGENT | Call: (734) 555-0123

💬 Reply: CLAIMED, BOOKED, COMPLETED, NO ANSWER, VOICEMAIL, DECLINED, TOO FAR, UNAVAILABLE, WRONG SERVICE, CALLBACK
\`\`\`

Simply reply with a keyword to update the lead status. It's that easy!

### Getting Started

👉 **Complete your profile now:** ${onboardUrl}

If you have any questions or need help with the onboarding process, just reply to this email. I'm here to help!

---

**Questions?**

- How do I set my service coverage? → We'll walk you through it in the onboarding flow
- Can I pause notifications? → Yes, you can toggle them on/off in your dashboard
- What if a lead is outside my area? → Just reply "TOO FAR" and we'll update your service radius
- Is there a cost for leads? → No subscription required — pay only for the leads you want

---

Best,
Hector
MobilePhlebotomy.org
support@mobilephlebotomy.org

P.S. Your featured placement is already active on our new Detroit city pages. Complete onboarding to unlock metro-wide visibility and start receiving qualified patient requests!`
    )

    console.log('✅ Onboarding email sent successfully!')
    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY:')
    console.log(`  Provider: ${provider.name}`)
    console.log(`  Email sent to: ${provider.email}`)
    console.log(`  Onboard URL: ${onboardUrl}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message)
    throw error
  }

  await prisma.$disconnect()
}

// Run the script
sendProStikOnboarding().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
