import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check send log for FL campaigns
  const log: Array<{ campaign: string; email: string; sentAt: string }> = JSON.parse(fs.readFileSync('data/email-send-log.json', 'utf-8'))

  const flCampaigns = log.filter(e => e.campaign.includes('fl'))

  console.log('=== FL OUTREACH EMAILS SENT ===\n')

  const byCampaign: Record<string, string[]> = {}
  for (const e of flCampaigns) {
    if (!byCampaign[e.campaign]) byCampaign[e.campaign] = []
    byCampaign[e.campaign].push(e.email)
  }

  for (const [campaign, emails] of Object.entries(byCampaign)) {
    console.log(`Campaign: ${campaign} (${emails.length} sent)`)
    emails.forEach(e => console.log(`  ${e}`))
    console.log('')
  }

  const allContacted = new Set(flCampaigns.map(e => e.email.toLowerCase()))
  console.log(`Total unique FL emails contacted: ${allContacted.size}\n`)

  // Now check: how many FL providers have email but were NOT contacted?
  const flProviders = await prisma.provider.findMany({
    where: { primaryState: 'FL' },
    select: { id: true, name: true, email: true, notificationEmail: true, primaryCity: true }
  })

  console.log(`=== FL PROVIDERS IN DB: ${flProviders.length} ===\n`)

  const withEmail = flProviders.filter(p => p.email || p.notificationEmail)
  const withoutEmail = flProviders.filter(p => !p.email && !p.notificationEmail)

  console.log(`With email: ${withEmail.length}`)
  console.log(`Without email: ${withoutEmail.length}\n`)

  // Who has email but wasn't contacted?
  const notContacted = withEmail.filter(p => {
    const email = (p.notificationEmail || p.email || '').toLowerCase()
    return !allContacted.has(email)
  })

  console.log(`=== FL PROVIDERS WITH EMAIL BUT NOT CONTACTED: ${notContacted.length} ===\n`)
  for (const p of notContacted) {
    console.log(`  ${p.name} (${p.primaryCity}) — ${p.notificationEmail || p.email}`)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total FL providers: ${flProviders.length}`)
  console.log(`Have email: ${withEmail.length}`)
  console.log(`No email: ${withoutEmail.length}`)
  console.log(`Contacted via outreach: ${allContacted.size}`)
  console.log(`Have email but NOT contacted: ${notContacted.length}`)

  await prisma.$disconnect()
}

main()
