import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Two passes over every provider email address.
 *
 *   1. FORMAT — catches what Brio Labs hit: "briosticks@gmail", no .com. The
 *      provider was eligibleForLeads with notifyEnabled, so every notification
 *      bounced and she looked dormant in the roster rather than broken.
 *
 *   2. DELIVERABILITY — cross-references SendGrid's bounces, blocks and
 *      invalid_emails suppression lists. A well-formed address that SendGrid
 *      has given up on is just as silent as a malformed one, and regex cannot
 *      see it.
 *
 * Read-only. Fixes nothing.
 */

// Deliberately stricter than RFC 5322: requires a dot-separated TLD of 2+
// characters, which is what the Brio case needed and what real provider
// addresses always have.
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[A-Za-z]{2,}$/

const COMMON_TYPOS = [
  /@gmail\.co$/i, /@gmial\./i, /@gmai\./i, /@gnail\./i,
  /@yahoo\.co$/i, /@yaho\./i,
  /@hotmial\./i, /@hotmail\.co$/i,
  /@outlok\./i, /@outloo\./i,
  /\.con$/i, /\.cm$/i, /\.ocm$/i, /\.comm$/i,
]

interface Finding {
  id: string
  name: string
  field: string
  value: string
  reason: string
  routable: boolean
  isNotifyTarget: boolean
}

async function sendgridSuppressions(): Promise<Map<string, string>> {
  const key = process.env.SENDGRID_API_KEY
  const out = new Map<string, string>()
  if (!key) return out
  const lists: Array<[string, string]> = [
    ['bounces', 'https://api.sendgrid.com/v3/suppression/bounces?limit=500'],
    ['blocks', 'https://api.sendgrid.com/v3/suppression/blocks?limit=500'],
    ['invalid', 'https://api.sendgrid.com/v3/suppression/invalid_emails?limit=500'],
  ]
  for (const [label, url] of lists) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
      if (!res.ok) { console.warn(`  (SendGrid ${label}: HTTP ${res.status})`); continue }
      const rows = await res.json() as Array<{ email?: string; reason?: string }>
      for (const r of rows) {
        if (r.email) out.set(r.email.toLowerCase(), `${label}: ${(r.reason || '').slice(0, 70)}`)
      }
    } catch (e: any) {
      console.warn(`  (SendGrid ${label} failed: ${e.message})`)
    }
  }
  return out
}

async function main() {
  console.log('Fetching SendGrid suppression lists…')
  const suppressed = await sendgridSuppressions()
  console.log(`  suppressed addresses known to SendGrid: ${suppressed.size}\n`)

  const providers = await prisma.provider.findMany({
    where: { removedAt: null },
    select: {
      id: true, name: true, email: true, claimEmail: true, notificationEmail: true,
      eligibleForLeads: true, notifyEnabled: true, status: true, isFeatured: true,
    },
  })

  const findings: Finding[] = []
  for (const p of providers) {
    const routable = p.notifyEnabled && (p.isFeatured || (p.eligibleForLeads && p.status === 'VERIFIED'))
    // The address the router actually uses, in the same order as the sender.
    const target = p.notificationEmail || p.claimEmail || p.email

    for (const [field, raw] of [
      ['notificationEmail', p.notificationEmail],
      ['claimEmail', p.claimEmail],
      ['email', p.email],
    ] as const) {
      if (!raw) continue
      const v = raw.trim()
      const isNotifyTarget = v === (target || '').trim()

      let reason: string | null = null
      if (raw !== v) reason = 'leading/trailing whitespace'
      else if (!EMAIL_RE.test(v)) reason = 'malformed — no valid domain/TLD'
      else if (COMMON_TYPOS.some(re => re.test(v))) reason = 'likely typo in domain'
      else if (suppressed.has(v.toLowerCase())) reason = `SendGrid ${suppressed.get(v.toLowerCase())}`

      if (reason) findings.push({ id: p.id, name: p.name, field, value: v, reason, routable, isNotifyTarget })
    }
  }

  // Worst first: a broken address that the router is actively aiming at.
  const rank = (f: Finding) => (f.isNotifyTarget && f.routable ? 0 : f.isNotifyTarget ? 1 : f.routable ? 2 : 3)
  findings.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))

  console.log('═'.repeat(104))
  console.log(`PROVIDER EMAIL AUDIT — ${providers.length} active providers, ${findings.length} findings`)
  console.log('═'.repeat(104))

  const critical = findings.filter(f => f.isNotifyTarget && f.routable)
  console.log(`\n🔴 SILENTLY UNREACHABLE — routable, and this is the address leads are sent to: ${critical.length}`)
  for (const f of critical) {
    console.log(`   ${f.name.slice(0, 36).padEnd(38)} ${f.field.padEnd(18)} "${f.value}"`)
    console.log(`      ${f.reason}`)
  }
  if (!critical.length) console.log('   (none)')

  const other = findings.filter(f => !(f.isNotifyTarget && f.routable))
  console.log(`\n── OTHER FINDINGS (not the live notify target, or not routable): ${other.length}`)
  for (const f of other.slice(0, 40)) {
    console.log(`   ${f.name.slice(0, 36).padEnd(38)} ${f.field.padEnd(18)} "${f.value.slice(0, 42)}"  ${f.reason}`)
  }
  if (other.length > 40) console.log(`   … and ${other.length - 40} more`)

  // Providers the router aims at nothing at all.
  const noTarget = providers.filter(p =>
    p.notifyEnabled && (p.isFeatured || (p.eligibleForLeads && p.status === 'VERIFIED')) &&
    !p.notificationEmail && !p.claimEmail && !p.email
  )
  console.log(`\n── ROUTABLE WITH NO EMAIL AT ALL: ${noTarget.length}`)
  for (const p of noTarget) console.log(`   ${p.name}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
