import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'fl-targeted-outreach-2026-03'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const SITE_URL = 'https://mobilephlebotomy.org'

// New providers to add
const newProviders = [
  {
    name: 'Mobile Phlebotomy Services FL',
    phone: '(754) 227-9238',
    email: 'Info@phlebotomy2go.com',
    website: 'https://mobilephlebotomyservicesfl.com',
    primaryCity: 'Fort Lauderdale',
    primaryState: 'FL',
  },
  {
    name: 'Hands That Care Mobile Phlebotomy',
    phone: '(386) 221-1670',
    email: 'info@handsthatcaremobilephlebotomy.com',
    website: 'https://handsthatcaremobilephlebotomy.com',
    primaryCity: 'Orlando',
    primaryState: 'FL',
  },
  {
    name: 'Oasis Phlebotomy',
    phone: '(877) 735-3531',
    email: 'info@oasisphlebotomy.com',
    website: 'https://oasisphlebotomy.com',
    primaryCity: 'Miami',
    primaryState: 'FL',
  },
]

// All 5 providers to email (including Express and SMP)
const outreachTargets = [
  { name: 'Mobile Phlebotomy Services FL', email: 'Info@phlebotomy2go.com', city: 'Fort Lauderdale' },
  { name: 'Express Mobile Phlebotomy', email: 'info@expressmobilephlebotomy.com', city: 'Fort Myers' },
  { name: 'Speedy Mobile Phlebotomy', email: 'SMPofFlorida@gmail.com', city: 'Fort Lauderdale' },
  { name: 'Hands That Care Mobile Phlebotomy', email: 'info@handsthatcaremobilephlebotomy.com', city: 'Orlando' },
  { name: 'Oasis Phlebotomy', email: 'info@oasisphlebotomy.com', city: 'Miami' },
]

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function buildEmail(providerName: string, city: string) {
  const subject = `We're sending you free patient leads in ${city}, FL`

  const text = `Hi ${providerName},

I'm reaching out from MobilePhlebotomy.org — we're the top Google result for "mobile phlebotomy near me" and we're actively getting patient requests in your area with no provider to send them to.

We'd like to send those patients directly to you. Here's how it works:

- Your listing is already live — patients in your area can find you now on MobilePhlebotomy.org
- When a patient requests a mobile phlebotomist, we email you their full contact info
- You call them and book the appointment — you keep 100% of the revenue
- No fees, no commission, no catch — we're growing our Florida network and want reliable providers in every market

We currently have unclaimed patient requests in Florida that went unserved because we didn't have a provider nearby. That's why we're reaching out.

To start receiving free patient referrals, just reply to this email with:
1. Your service area (cities or ZIP codes you cover)
2. Best phone number to reach you
3. Best email for lead notifications

That's it — no login, no app, no contract. We'll start routing patients to you immediately.

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
    <p>Hi ${providerName},</p>

    <p>I'm reaching out from <strong>MobilePhlebotomy.org</strong> — we're the top Google result for "mobile phlebotomy near me" and we're actively getting patient requests in your area with <strong>no provider to send them to.</strong></p>

    <p>We'd like to send those patients directly to you. Here's how it works:</p>

    <ul>
      <li><strong>Your listing is already live</strong> — patients in your area can find you now on MobilePhlebotomy.org</li>
      <li><strong>When a patient requests a mobile phlebotomist</strong>, we email you their full contact info</li>
      <li><strong>You call them and book the appointment</strong> — you keep 100% of the revenue</li>
      <li><strong>No fees, no commission, no catch</strong> — we're growing our Florida network and want reliable providers in every market</li>
    </ul>

    <div class="highlight">
      <strong>We currently have unclaimed patient requests in Florida</strong> that went unserved because we didn't have a provider nearby. That's why we're reaching out.
    </div>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>To start receiving free patient referrals</strong>, just reply to this email with:</p>
      <ol>
        <li>Your service area (cities or ZIP codes you cover)</li>
        <li>Best phone number to reach you</li>
        <li>Best email for lead notifications</li>
      </ol>
      <p style="margin-bottom: 0;">That's it — no login, no app, no contract. We'll start routing patients to you immediately.</p>
    </div>

    <p>— Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

async function main() {
  // Step 1: Add missing providers
  console.log('=== ADDING NEW PROVIDERS ===\n')

  for (const p of newProviders) {
    const existing = await prisma.provider.findFirst({
      where: {
        OR: [
          { email: { equals: p.email, mode: 'insensitive' } },
          { name: { equals: p.name, mode: 'insensitive' } },
        ]
      }
    })

    if (existing) {
      console.log(`⏭️  ${p.name} already exists (${existing.id})`)
      continue
    }

    const created = await prisma.provider.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        phone: p.phone,
        phonePublic: p.phone,
        email: p.email,
        notificationEmail: p.email,
        website: p.website,
        primaryCity: p.primaryCity,
        primaryState: p.primaryState,
        status: 'UNVERIFIED',
        notifyEnabled: true,
      }
    })
    console.log(`✅ Created: ${p.name} (${created.id}) — ${p.primaryCity}, FL`)
  }

  // Step 2: Also add SMP of Florida if not present
  const smpExists = await prisma.provider.findFirst({
    where: {
      OR: [
        { email: { equals: 'SMPofFlorida@gmail.com', mode: 'insensitive' } },
        { name: { contains: 'Speedy Mobile', mode: 'insensitive' } },
        { website: { contains: 'smpofflorida', mode: 'insensitive' } },
      ]
    }
  })

  if (!smpExists) {
    const created = await prisma.provider.create({
      data: {
        name: 'Speedy Mobile Phlebotomy',
        slug: slugify('Speedy Mobile Phlebotomy'),
        phone: '(954) 232-9752',
        phonePublic: '(954) 232-9752',
        email: 'SMPofFlorida@gmail.com',
        notificationEmail: 'SMPofFlorida@gmail.com',
        website: 'https://smpofflorida.com',
        primaryCity: 'Fort Lauderdale',
        primaryState: 'FL',
        status: 'UNVERIFIED',
        notifyEnabled: true,
      }
    })
    console.log(`✅ Created: Speedy Mobile Phlebotomy (${created.id}) — Fort Lauderdale, FL`)
  } else {
    console.log(`⏭️  Speedy Mobile Phlebotomy already exists (${smpExists.id})`)
  }

  // Step 3: Update Express Mobile Phlebotomy email
  const express = await prisma.provider.findFirst({
    where: { name: { contains: 'Express Mobile Phlebotomy', mode: 'insensitive' }, primaryState: 'FL' }
  })
  if (express) {
    await prisma.provider.update({
      where: { id: express.id },
      data: {
        email: 'info@expressmobilephlebotomy.com',
        notificationEmail: 'info@expressmobilephlebotomy.com',
        notifyEnabled: true,
      }
    })
    console.log(`✅ Updated Express Mobile Phlebotomy email → info@expressmobilephlebotomy.com`)
  }

  // Step 4: Send outreach emails
  console.log('\n=== SENDING OUTREACH EMAILS ===\n')

  const sendLog = loadSendLog()
  let sent = 0
  let skipped = 0

  for (const target of outreachTargets) {
    const alreadySent = sendLog.some(
      e => e.campaign === CAMPAIGN && e.email.toLowerCase() === target.email.toLowerCase()
    )
    if (alreadySent) {
      console.log(`⏭️  Already sent to ${target.name} (${target.email})`)
      skipped++
      continue
    }

    const { subject, text, html } = buildEmail(target.name, target.city)

    try {
      await sg.send({
        to: target.email,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject,
        text,
        html,
      })

      sendLog.push({ campaign: CAMPAIGN, email: target.email.toLowerCase(), sentAt: new Date().toISOString() })
      saveSendLog(sendLog)

      console.log(`✅ Sent to ${target.name} (${target.email})`)
      sent++
    } catch (err: any) {
      console.error(`❌ Failed: ${target.name} — ${err.message}`)
    }
  }

  console.log(`\n=== DONE: ${sent} sent, ${skipped} skipped ===`)

  await prisma.$disconnect()
}

main()
