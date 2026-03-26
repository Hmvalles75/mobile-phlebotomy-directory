import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'inactive-signup-activation-2026-03'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function buildEmail(name: string, city: string, state: string) {
  const subject = `You signed up on MobilePhlebotomy.org — we're now sending free patient leads`

  const text = `Hi ${name},

You signed up on MobilePhlebotomy.org a while back and your listing is live — thank you for that.

Since then, we've launched a free lead routing system. When a patient in your area requests a mobile phlebotomist through our site, we now email you their full contact info so you can call and book them directly.

Here's how it works:

- A patient near ${city}, ${state} submits a request on our site
- We email you their name, phone number, location, and lab details
- You call them and schedule the appointment — you keep 100% of the revenue
- No fees, no commission — this is completely free

We're already routing leads to providers in other markets and it's working well. We'd love to include you.

To start receiving free patient referrals, just reply to this email with:
1. Confirm your service area (cities or ZIP codes you cover)
2. Best phone number to reach you
3. Best email for lead notifications

That's it — no login, no app, no contract. We'll activate you immediately.

— Hector Valles
MobilePhlebotomy.org`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
    .cta-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi ${name},</p>

    <p>You signed up on <strong>MobilePhlebotomy.org</strong> a while back and your listing is live — thank you for that.</p>

    <p>Since then, we've launched a <strong>free lead routing system</strong>. When a patient in your area requests a mobile phlebotomist through our site, we now email you their full contact info so you can call and book them directly.</p>

    <p>Here's how it works:</p>

    <ul>
      <li>A patient near <strong>${city}, ${state}</strong> submits a request on our site</li>
      <li>We email you their <strong>name, phone number, location, and lab details</strong></li>
      <li>You call them and schedule the appointment — <strong>you keep 100% of the revenue</strong></li>
      <li><strong>No fees, no commission</strong> — this is completely free</li>
    </ul>

    <div class="highlight">
      We're already routing leads to providers in other markets and it's working well. We'd love to include you.
    </div>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>To start receiving free patient referrals</strong>, just reply with:</p>
      <ol>
        <li>Confirm your service area (cities or ZIP codes you cover)</li>
        <li>Best phone number to reach you</li>
        <li>Best email for lead notifications</li>
      </ol>
      <p style="margin-bottom: 0;">That's it — no login, no app, no contract. We'll activate you immediately.</p>
    </div>

    <p>— Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

async function main() {
  // Get approved submissions that are not active for leads
  const submissions = await prisma.pendingSubmission.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      businessName: true,
      email: true,
      city: true,
      state: true,
    },
    orderBy: { submittedAt: 'desc' }
  })

  const sendLog = loadSendLog()
  let sent = 0
  let skipped = 0
  let alreadyActive = 0
  const seenEmails = new Set<string>()

  for (const sub of submissions) {
    const email = sub.email.toLowerCase()

    // Skip duplicates within this batch
    if (seenEmails.has(email)) {
      skipped++
      continue
    }
    seenEmails.add(email)

    // Find linked provider
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { email: { equals: sub.email, mode: 'insensitive' } },
          { name: { equals: sub.businessName, mode: 'insensitive' } },
        ]
      },
      select: { eligibleForLeads: true, isFeatured: true, notifyEnabled: true }
    })

    // Skip if already active
    if (provider?.eligibleForLeads || (provider?.isFeatured && provider?.notifyEnabled)) {
      alreadyActive++
      continue
    }

    // Skip if already sent this campaign
    const alreadySent = sendLog.some(
      e => e.campaign === CAMPAIGN && e.email === email
    )
    if (alreadySent) {
      console.log(`⏭️  Already sent: ${sub.businessName}`)
      skipped++
      continue
    }

    const { subject, text, html } = buildEmail(sub.businessName, sub.city, sub.state)

    try {
      await sg.send({
        to: sub.email,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject,
        text,
        html,
      })

      sendLog.push({ campaign: CAMPAIGN, email, sentAt: new Date().toISOString() })
      saveSendLog(sendLog)

      console.log(`✅ ${sub.businessName} (${sub.city}, ${sub.state}) → ${sub.email}`)
      sent++
    } catch (err: any) {
      console.error(`❌ ${sub.businessName}: ${err.message}`)
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`Sent: ${sent}`)
  console.log(`Already active: ${alreadyActive}`)
  console.log(`Skipped (dupes/already sent): ${skipped}`)

  await prisma.$disconnect()
}

main()
