import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { checkProviderEmail } from '../lib/emailValidation'

const prisma = new PrismaClient()

/**
 * Working call list for the 19 providers whose live notification address is
 * dead. Split by what you can actually do about each one:
 *
 *   FIXABLE   — a typo with a confident correction. No call needed.
 *   VERIFY    — domain looks misspelled but the right spelling is a guess.
 *               Check their website first.
 *   CALL      — well-formed address, mailbox gone. Only they can supply a new
 *               one, and you cannot email them to ask.
 *
 * Ordered by how much traffic each is missing, so the calls that matter most
 * come first. Read-only.
 */
async function sendgridSuppressions(): Promise<Map<string, string>> {
  const key = process.env.SENDGRID_API_KEY
  const out = new Map<string, string>()
  if (!key) return out
  for (const [label, url] of [
    ['bounce', 'https://api.sendgrid.com/v3/suppression/bounces?limit=500'],
    ['block', 'https://api.sendgrid.com/v3/suppression/blocks?limit=500'],
    ['invalid', 'https://api.sendgrid.com/v3/suppression/invalid_emails?limit=500'],
  ] as Array<[string, string]>) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
      if (!res.ok) continue
      for (const r of (await res.json()) as Array<{ email?: string; reason?: string }>) {
        if (r.email) out.set(r.email.toLowerCase(), `${label}: ${(r.reason || '').slice(0, 90)}`)
      }
    } catch { /* non-fatal */ }
  }
  return out
}

async function main() {
  const suppressed = await sendgridSuppressions()
  const D90 = new Date(Date.now() - 90 * 86400000)

  const providers = await prisma.provider.findMany({
    where: { removedAt: null },
    select: {
      id: true, name: true, slug: true,
      email: true, claimEmail: true, notificationEmail: true,
      phone: true, phonePublic: true, website: true,
      primaryCity: true, primaryState: true,
      eligibleForLeads: true, notifyEnabled: true, status: true, isFeatured: true,
    },
  })

  type Row = {
    name: string; phone: string; website: string; loc: string
    target: string; problem: string; bucket: 'FIXABLE' | 'VERIFY' | 'CALL'
    suggestion?: string; notifs: number
  }
  const rows: Row[] = []

  for (const p of providers) {
    const routable = p.notifyEnabled && (p.isFeatured || (p.eligibleForLeads && p.status === 'VERIFIED'))
    if (!routable) continue
    const target = (p.notificationEmail || p.claimEmail || p.email || '').trim()
    if (!target) continue

    const fmt = checkProviderEmail(target)
    const supp = suppressed.get(target.toLowerCase())
    if (fmt.ok && !supp) continue

    const notifs = await prisma.leadNotification.count({
      where: { providerId: p.id, createdAt: { gte: D90 } },
    })

    let bucket: Row['bucket'] = 'CALL'
    let problem: string
    if (!fmt.ok && fmt.suggestion) { bucket = 'FIXABLE'; problem = `typo — ${fmt.error}` }
    else if (!fmt.ok) { bucket = 'VERIFY'; problem = fmt.error || 'malformed' }
    else { bucket = supp!.includes('block') ? 'VERIFY' : 'CALL'; problem = supp! }

    rows.push({
      name: p.name,
      phone: p.phonePublic || p.phone || '(no phone)',
      website: p.website || '(no site)',
      loc: `${p.primaryCity || '?'}, ${p.primaryState || '?'}`,
      target, problem, bucket, suggestion: fmt.suggestion, notifs,
    })
  }

  rows.sort((a, b) => b.notifs - a.notifs)
  const show = (b: Row['bucket']) => rows.filter(r => r.bucket === b)

  const section = (title: string, list: Row[], note: string) => {
    console.log(`\n${'═'.repeat(96)}`)
    console.log(`${title}  (${list.length})`)
    console.log(note)
    console.log('═'.repeat(96))
    for (const r of list) {
      console.log(`\n  ${r.name}   —   ${r.loc}   —   ${r.notifs} notifications sent (90d)`)
      console.log(`     current: ${r.target}`)
      if (r.suggestion) console.log(`     likely:  ${r.suggestion}`)
      console.log(`     phone:   ${r.phone}`)
      console.log(`     site:    ${r.website}`)
      console.log(`     problem: ${r.problem}`)
    }
    if (!list.length) console.log('  (none)')
  }

  console.log(`Providers routable with a dead notification address: ${rows.length}`)
  console.log(`Notifications wasted on them in the last 90 days: ${rows.reduce((s, r) => s + r.notifs, 0)}`)

  section('FIXABLE — correct these yourself, no call needed', show('FIXABLE'),
    'The correction is unambiguous. Update, then send a test.')
  section('VERIFY — check their website, then correct', show('VERIFY'),
    'Domain looks misspelled but the right spelling is a guess. Confirm before changing.')
  section('CALL — only they can give you a new address', show('CALL'),
    'Well-formed address, mailbox gone. You cannot email them to ask.')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
