import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

async function main() {
  // Find the Minustouch provider
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'Minustouch', mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      email: true,
      notificationEmail: true,
      primaryCity: true,
      primaryState: true,
    }
  })

  if (!provider) {
    console.log('❌ Minustouch not found')
    await prisma.$disconnect()
    return
  }

  const recipientEmail = provider.notificationEmail || provider.email
  console.log(`Found: ${provider.name} (${provider.primaryCity}, ${provider.primaryState})`)
  console.log(`Email: ${recipientEmail}\n`)

  // Find open FL leads
  const openLeads = await prisma.lead.findMany({
    where: {
      status: 'OPEN',
      state: 'FL',
    },
    select: {
      id: true,
      fullName: true,
      city: true,
      state: true,
      zip: true,
      labPreference: true,
      urgency: true,
      notes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Open FL leads: ${openLeads.length}\n`)

  if (openLeads.length === 0 || !recipientEmail) {
    await prisma.$disconnect()
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
  let sent = 0

  for (const lead of openLeads) {
    const claimUrl = `${siteUrl}/claim/${lead.id}?provider=${provider.id}`
    const daysOld = Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const notesShort = lead.notes ? lead.notes.substring(0, 200) : 'None'

    const subject = `Open patient request in ${lead.city}, FL — still needs a provider`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .button { display: inline-block; padding: 18px 40px; background-color: #28a745; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 18px; }
    .footer { padding: 20px; text-align: center; color: #777; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Patient Still Waiting — ${daysOld} Days</h2>
    </div>
    <div class="content">
      <p>Hi ${provider.name},</p>
      <p>This patient requested a mobile phlebotomist <strong>${daysOld} days ago</strong> and still hasn't been connected with a provider. Can you help?</p>

      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <div class="detail-row">
          <span class="detail-label">Location:</span> ${lead.city}, ${lead.state} ${lead.zip}
        </div>
        <div class="detail-row">
          <span class="detail-label">Lab preference:</span> <strong>${lead.labPreference}</strong>
        </div>
        <div class="detail-row">
          <span class="detail-label">Urgency:</span> <strong style="color: ${lead.urgency === 'STAT' ? '#dc3545' : '#0066cc'};">${lead.urgency === 'STAT' ? 'STAT (Urgent)' : 'Standard'}</strong>
        </div>
        ${lead.notes ? `<div class="detail-row">
          <span class="detail-label">Notes:</span> ${notesShort}
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Requested:</span> ${lead.createdAt.toISOString().split('T')[0]}
        </div>
      </div>

      <center>
        <a href="${claimUrl}" class="button">Claim This Patient</a>
        <br>
        <span style="color: #28a745; font-size: 14px; font-weight: bold;">One click — no login required. Completely free.</span>
      </center>

      <p style="color: #777; font-size: 14px; margin-top: 30px;">
        First provider to claim gets the patient's full contact info.
      </p>
    </div>
    <div class="footer">
      <p>MobilePhlebotomy.org</p>
    </div>
  </div>
</body>
</html>`

    const text = `Hi ${provider.name},

This patient requested a mobile phlebotomist ${daysOld} days ago and still hasn't been connected with a provider.

Location: ${lead.city}, ${lead.state} ${lead.zip}
Lab preference: ${lead.labPreference}
Urgency: ${lead.urgency}
${lead.notes ? `Notes: ${notesShort}` : ''}
Requested: ${lead.createdAt.toISOString().split('T')[0]}

Claim this patient (free, one click):
${claimUrl}

— MobilePhlebotomy.org`

    try {
      await sg.send({
        to: recipientEmail,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        subject,
        text,
        html,
      })

      await prisma.leadNotification.create({
        data: {
          leadId: lead.id,
          providerId: provider.id,
          channel: 'email',
          status: 'SENT',
          sentAt: new Date(),
        }
      })

      console.log(`✅ ${lead.fullName} (${lead.city}, FL ${lead.zip}) — ${daysOld} days old`)
      sent++
    } catch (err: any) {
      console.error(`❌ ${lead.fullName}: ${err.message}`)
    }
  }

  console.log(`\n=== DONE: ${sent} FL leads sent to ${provider.name} ===`)
  await prisma.$disconnect()
}

main()
