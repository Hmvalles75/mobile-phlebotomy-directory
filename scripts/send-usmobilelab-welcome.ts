import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const prisma = new PrismaClient()
const PROVIDER_ID = 'cmmkycftr0002lb04lp0z3kwo'

async function sendWelcomeEmail() {
  const provider = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    include: {
      services: { include: { service: true } },
      coverage: { include: { city: true, state: true } }
    }
  })

  if (!provider) {
    console.log('❌ US Mobile Lab not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found: ${provider.name}`)
  console.log(`   Email: ${provider.email}`)
  console.log(`   Featured: ${provider.isFeatured}`)
  console.log(`   Tier: ${provider.featuredTier}`)
  console.log()

  const listingUrl = `https://www.mobilephlebotomy.org/provider/${provider.slug}`
  const metroUrl = `https://www.mobilephlebotomy.org/us/metro/detroit`
  const stateUrl = `https://www.mobilephlebotomy.org/us/michigan`

  const services = provider.services.map(s => s.service.name)
  const cities = provider.coverage
    .filter(c => c.city)
    .map(c => c.city!.name)
    .slice(0, 10)

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0f766e; margin: 0;">Welcome to Featured Provider Status!</h1>
    <p style="color: #666; font-size: 16px;">Your upgraded listing on MobilePhlebotomy.org is live</p>
  </div>

  <p>Hi US Mobile Lab team,</p>

  <p>Congratulations! Your business has been upgraded to <strong>Featured Provider</strong> on MobilePhlebotomy.org. Here's what's included and where you're listed:</p>

  <div style="background: #f0fdfa; border: 2px solid #0f766e; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #0f766e; margin-top: 0;">⭐ What's Included</h2>
    <ul style="line-height: 1.8;">
      <li><strong>Featured badge</strong> — gold "Featured Provider" badge on all listings</li>
      <li><strong>Priority placement</strong> — appear above basic providers in search results</li>
      <li><strong>Detroit Metro coverage</strong> — 100-mile radius from your location</li>
      <li><strong>Instant lead notifications</strong> — email alerts when patients request service in your area</li>
      <li><strong>One-click claiming</strong> — claim leads directly from notification emails</li>
      <li><strong>Enhanced profile page</strong> — full services, description, logo, and contact info</li>
      <li><strong>Multi-page visibility</strong> — you appear on state, metro, and city pages</li>
    </ul>
  </div>

  <div style="background: #fefce8; border: 2px solid #ca8a04; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #92400e; margin-top: 0;">📍 Where You're Listed</h2>
    <ul style="line-height: 1.8;">
      <li><strong>Your profile:</strong> <a href="${listingUrl}" style="color: #0f766e;">${listingUrl}</a></li>
      <li><strong>Detroit Metro page:</strong> <a href="${metroUrl}" style="color: #0f766e;">${metroUrl}</a></li>
      <li><strong>Michigan state page:</strong> <a href="${stateUrl}" style="color: #0f766e;">${stateUrl}</a></li>
    </ul>
    <p style="margin-bottom: 0;"><strong>Coverage area:</strong> Oakland, Macomb, Wayne, Livingston, St. Clair, Lapeer, and Monroe counties — 100-mile radius from Detroit Metro.</p>
  </div>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #334155; margin-top: 0;">🔧 Your Current Services Listed</h2>
    <ul style="line-height: 1.8;">
      ${services.map(s => `<li>${s}</li>`).join('\n      ')}
    </ul>
  </div>

  <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1e40af; margin-top: 0;">📞 How Leads Work</h2>
    <p>When a patient in your service area submits a request on our site:</p>
    <ol style="line-height: 1.8;">
      <li>You'll receive an <strong>email notification</strong> with the patient's details</li>
      <li>Click the green <strong>"Claim This Patient"</strong> button in the email</li>
      <li>You'll instantly see their name, phone number, and service details</li>
      <li>Contact the patient directly to schedule the appointment</li>
    </ol>
    <p style="margin-bottom: 0;"><strong>No login required</strong> — it's one click from email to patient info.</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${listingUrl}" style="display: inline-block; background: #0f766e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">View Your Listing →</a>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p><strong>Want to change anything?</strong></p>
  <p>Just reply to this email with any updates you'd like to make:</p>
  <ul style="line-height: 1.8;">
    <li>Add or remove services</li>
    <li>Update your description or business hours</li>
    <li>Change your service area or coverage radius</li>
    <li>Update your logo, phone number, or website</li>
  </ul>

  <p>We're here to make sure your listing is exactly how you want it.</p>

  <p>Best,<br>
  <strong>Hector</strong><br>
  MobilePhlebotomy.org<br>
  <a href="mailto:support@mobilephlebotomy.org" style="color: #0f766e;">support@mobilephlebotomy.org</a></p>

</body>
</html>
  `.trim()

  console.log('📧 Sending welcome email...\n')

  try {
    await sg.send({
      to: provider.email!,
      from: process.env.LEAD_EMAIL_FROM!,
      subject: 'Your US Mobile Lab Featured Provider Listing is Live! ⭐',
      html: emailHtml
    })
    console.log(`✅ Email sent to ${provider.email}`)
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.body || error.message)
  }

  await prisma.$disconnect()
}

sendWelcomeEmail().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
