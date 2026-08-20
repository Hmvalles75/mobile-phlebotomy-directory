import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Reconcile SendGrid's suppression lists against provider records.
 *
 *   npx tsx scripts/reconcile-suppressed-emails.ts           # dry run
 *   npx tsx scripts/reconcile-suppressed-emails.ts --apply   # writes
 *
 * Until the Event Webhook was enabled on 2026-08-17 none of this was visible.
 * A provider whose address bounced kept appearing healthy in the roster,
 * kept being counted as reachable coverage, and kept "receiving" leads that
 * were dropped on the floor. Resolute Mobile Lab complained twice that leads
 * weren't showing up; her address had been bouncing since 2026-06-11 and the
 * answer was in SendGrid the whole time. Tender Touch shows 38 notifications
 * and zero claims because their mail host bans SendGrid's IP outright.
 *
 * BOUNCED addresses (550 mailbox not found) are dead. With --apply their
 * provider's notifyEnabled is turned off so they stop being counted as
 * reachable, and they land on a call list for recovery by phone.
 *
 * BLOCKED addresses are reported but never auto-disabled. Blocks are often
 * transient — ClearPath was blocked on 2026-08-20 by a timeout on their own
 * mail server and was delivering again within the hour. Clearing the block is
 * usually the right move, not disabling the provider.
 *
 * suppressHardBouncedProviders() in the events webhook handles everything from
 * here forward. This is the one-off catch-up for what predates it.
 */

const KEY = process.env.SENDGRID_API_KEY
const APPLY = process.argv.includes('--apply')

interface Suppressed { email: string; reason: string; created: number }

async function fetchList(path: string): Promise<Suppressed[]> {
  const res = await fetch(`https://api.sendgrid.com/v3/suppression/${path}?limit=500`, {
    headers: { Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const json = await res.json() as any[]
  return Array.isArray(json) ? json : []
}

async function main() {
  if (!KEY) { console.error('SENDGRID_API_KEY not set'); process.exit(1) }

  const [bounces, blocks, invalid] = await Promise.all([
    fetchList('bounces'), fetchList('blocks'), fetchList('invalid_emails'),
  ])

  // Blocks repeat per failed attempt; collapse to the most recent per address.
  const dedupe = (rows: Suppressed[]) => {
    const m = new Map<string, Suppressed>()
    for (const r of rows) {
      const k = r.email.toLowerCase()
      const prev = m.get(k)
      if (!prev || r.created > prev.created) m.set(k, r)
    }
    return [...m.values()]
  }

  const groups: Array<{ kind: 'BOUNCED' | 'BLOCKED' | 'INVALID'; rows: Suppressed[] }> = [
    { kind: 'BOUNCED', rows: dedupe(bounces) },
    { kind: 'INVALID', rows: dedupe(invalid) },
    { kind: 'BLOCKED', rows: dedupe(blocks) },
  ]

  const callList: string[] = []
  let disabled = 0

  for (const { kind, rows } of groups) {
    console.log(`\n${'='.repeat(96)}\n${kind} — ${rows.length} address(es)\n${'='.repeat(96)}`)
    if (!rows.length) { console.log('  (none)'); continue }

    for (const s of rows) {
      const p = await prisma.provider.findFirst({
        where: {
          OR: [
            { email: { equals: s.email, mode: 'insensitive' } },
            { claimEmail: { equals: s.email, mode: 'insensitive' } },
            { notificationEmail: { equals: s.email, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, name: true, phone: true, primaryCity: true, primaryState: true,
          notifyEnabled: true, eligibleForLeads: true, removedAt: true, priorityRouting: true,
        },
      })

      const when = new Date(s.created * 1000).toISOString().slice(0, 10)
      if (!p) {
        console.log(`  ${when}  ${s.email.padEnd(44)} — no provider record (stale or outreach-only address)`)
        continue
      }

      const wasted = await prisma.leadNotification.count({ where: { providerId: p.id } })
      const state = p.removedAt ? 'removed' : p.notifyEnabled ? 'STILL NOTIFIABLE' : 'notifications off'
      console.log(`  ${when}  ${s.email.padEnd(44)} ${p.priorityRouting ? '[PAYING] ' : ''}${(p.name ?? '').slice(0, 30).padEnd(30)} ${state}  ${wasted} notification(s) sent`)
      console.log(`            ${String(s.reason).replace(/\s+/g, ' ').slice(0, 88)}`)

      // Only bounced/invalid are treated as dead. Blocks are often transient.
      if ((kind === 'BOUNCED' || kind === 'INVALID') && !p.removedAt && p.notifyEnabled) {
        callList.push(`  ${(p.name ?? '').slice(0, 32).padEnd(32)} ${(p.phone ?? 'no phone').padEnd(16)} ${(p.primaryCity ?? '')}, ${p.primaryState ?? ''}  — ${s.email}`)
        if (APPLY) {
          await prisma.provider.update({ where: { id: p.id }, data: { notifyEnabled: false } })
          disabled++
          console.log(`            -> notifyEnabled set false`)
        } else {
          console.log(`            -> WOULD set notifyEnabled false (run with --apply)`)
        }
      }
    }
  }

  console.log(`\n${'='.repeat(96)}`)
  console.log(APPLY ? `Disabled notifications for ${disabled} provider(s) with dead addresses.`
                    : `Dry run. ${callList.length} provider(s) would have notifications disabled. Re-run with --apply.`)

  if (callList.length) {
    console.log(`\nCALL LIST — reachable by phone, need a working email address:\n`)
    callList.forEach(l => console.log(l))
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
