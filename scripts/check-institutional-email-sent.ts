import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Did the admin-panel follow-up actually go out?
 *
 * app/api/admin/corporate-inquiries/[id]/email/route.ts only writes a
 * ContactAttempt row AFTER SendGrid returns a 2xx — on failure it writes
 * nothing at all. So the presence of a row is proof of a successful handoff
 * to SendGrid.
 *
 * Handoff is not delivery, though, so this also checks SendGrid's own
 * suppression lists for the recipient: an address on bounces/blocks/invalid
 * accepted the API call and then failed to deliver.
 */
async function sendgridSuppression(email: string): Promise<string | null> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return null
  for (const [label, url] of [
    ['bounce', 'https://api.sendgrid.com/v3/suppression/bounces?limit=500'],
    ['block', 'https://api.sendgrid.com/v3/suppression/blocks?limit=500'],
    ['invalid', 'https://api.sendgrid.com/v3/suppression/invalid_emails?limit=500'],
  ] as Array<[string, string]>) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
      if (!res.ok) continue
      for (const r of (await res.json()) as Array<{ email?: string; reason?: string }>) {
        if (r.email?.toLowerCase() === email.toLowerCase()) {
          return `${label}: ${(r.reason || '').slice(0, 100)}`
        }
      }
    } catch { /* non-fatal */ }
  }
  return null
}

async function main() {
  const attempts = await prisma.contactAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      lead: {
        select: {
          organizationName: true, contactName: true, email: true,
          status: true, lastContactedAt: true, estimatedVolume: true, timeline: true,
        },
      },
    },
  })

  console.log('═'.repeat(90))
  console.log(`RECENT ADMIN-PANEL SENDS — ${attempts.length} most recent ContactAttempt rows`)
  console.log('═'.repeat(90))

  if (attempts.length === 0) {
    console.log('\n  No ContactAttempt rows at all. Nothing has been sent through the admin panel.')
    await prisma.$disconnect()
    return
  }

  for (const a of attempts) {
    const r = a as any
    const req = r.lead

    console.log(`\n  ${a.createdAt.toISOString().slice(0, 16).replace('T', ' ')}  ${req?.organizationName || '(unlinked)'}`)
    console.log(`     to:       ${req?.email || r.email || '?'}`)
    console.log(`     contact:  ${req?.contactName || '?'}`)
    console.log(`     subject:  ${(r.subject || '(none)').slice(0, 70)}`)
    console.log(`     channel:  ${r.channel} ${r.direction}`)
    if (req) {
      console.log(`     status:   ${req.status}   lastContactedAt=${req.lastContactedAt?.toISOString().slice(0, 16).replace('T', ' ') || 'unset'}`)
    }
    const addr = req?.email || r.email
    if (addr) {
      const supp = await sendgridSuppression(addr)
      console.log(`     delivery: ${supp ? `⚠ SendGrid ${supp}` : 'accepted by SendGrid, no bounce recorded'}`)
    }
  }

  console.log(`\n${'═'.repeat(90)}`)
  console.log('How to read this: a row exists = SendGrid accepted it (2xx).')
  console.log('The route writes nothing on failure, so a missing row means it did NOT send.')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
