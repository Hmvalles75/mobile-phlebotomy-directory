import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { NOTIFIABLE_WHERE, canNotify } from '../lib/canNotify'

const prisma = new PrismaClient()

/**
 * Runs each provider-recipient query in its OLD (unguarded) and NEW (guarded)
 * form and prints who falls out. Read-only — sends nothing.
 *
 *   npx tsx scripts/checkBlastList.ts
 */
interface Check {
  label: string
  file: string
  oldWhere: any
  newWhere: any
}

const CHECKS: Check[] = [
  {
    label: 'Recruitment blast (the reported bug)',
    file: 'lib/notifyProvider.ts → reachOutToNearbyProviders',
    oldWhere: { zipCodes: { not: null }, eligibleForLeads: false, status: 'VERIFIED' },
    newWhere: { ...NOTIFIABLE_WHERE, zipCodes: { not: null }, eligibleForLeads: false, status: 'VERIFIED' },
  },
  {
    label: 'Lead notification (primary email path)',
    file: 'lib/leadNotifications.ts → findFeaturedProvidersForNotification',
    oldWhere: {
      notifyEnabled: true,
      OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }],
    },
    newWhere: {
      ...NOTIFIABLE_WHERE,
      OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }],
    },
  },
  {
    label: 'SMS claim offers (opted-in)',
    file: 'lib/optedInRouting.ts → findOptedInProviders',
    oldWhere: {
      eligibleForLeads: true, smsOptInAt: { not: null }, smsOptOutAt: null,
      onboardingStatus: 'ACTIVE', phonePublic: { not: null }, zipCodes: { not: null },
    },
    newWhere: {
      ...NOTIFIABLE_WHERE,
      eligibleForLeads: true, smsOptInAt: { not: null }, smsOptOutAt: null,
      onboardingStatus: 'ACTIVE', phonePublic: { not: null }, zipCodes: { not: null },
    },
  },
  {
    label: 'SMS blast',
    file: 'lib/smsBlast.ts → findEligibleProvidersForSMS',
    oldWhere: { eligibleForLeads: true, zipCodes: { not: null }, phonePublic: { not: null } },
    newWhere: { ...NOTIFIABLE_WHERE, eligibleForLeads: true, zipCodes: { not: null }, phonePublic: { not: null } },
  },
  {
    label: 'Catch-missed-notifications cron',
    file: 'app/api/cron/catch-missed-notifications/route.ts',
    oldWhere: { isFeatured: true, notifyEnabled: true },
    newWhere: { ...NOTIFIABLE_WHERE, isFeatured: true },
  },
]

const SELECT = {
  id: true, name: true, email: true, claimEmail: true, notificationEmail: true,
  removedAt: true, notifyEnabled: true, removedReason: true,
} as const

async function main() {
  console.log('═'.repeat(94))
  console.log('BLAST LIST GUARD CHECK — old query vs new query (read-only, sends nothing)')
  console.log('═'.repeat(94))

  let grandTotal = 0
  const everyDropped = new Map<string, { name: string; reason: string; paths: string[] }>()

  for (const c of CHECKS) {
    const [oldRows, newRows] = await Promise.all([
      prisma.provider.findMany({ where: c.oldWhere, select: SELECT }),
      prisma.provider.findMany({ where: c.newWhere, select: SELECT }),
    ])
    const newIds = new Set(newRows.map(r => r.id))
    const dropped = oldRows.filter(r => !newIds.has(r.id))

    console.log(`\n── ${c.label}`)
    console.log(`   ${c.file}`)
    console.log(`   OLD: ${String(oldRows.length).padStart(4)} recipients`)
    console.log(`   NEW: ${String(newRows.length).padStart(4)} recipients`)
    console.log(`   DROPPED: ${dropped.length}`)

    for (const d of dropped) {
      const email = d.notificationEmail || d.claimEmail || d.email || '(no email)'
      const reason = d.removedAt ? `removed ${d.removedAt.toISOString().slice(0, 10)}` : 'notifyEnabled=false'
      console.log(`     - ${email.padEnd(42).slice(0, 42)} ${d.name.slice(0, 30).padEnd(30)} ${reason}`)
      const e = everyDropped.get(d.id) || { name: d.name, reason, paths: [] }
      e.paths.push(c.label)
      everyDropped.set(d.id, e)
    }
    grandTotal += dropped.length
  }

  console.log(`\n${'═'.repeat(94)}`)
  console.log(`TOTAL suppressed recipient-slots across all paths: ${grandTotal}`)
  console.log(`DISTINCT providers newly excluded: ${everyDropped.size}`)
  console.log('═'.repeat(94))
  for (const [, v] of everyDropped) {
    console.log(`  ${v.name.padEnd(44).slice(0, 44)} ${v.reason.padEnd(24)} on ${v.paths.length} path(s)`)
  }

  // Sanity: the guard function must agree with the where-clause.
  const removed = await prisma.provider.findMany({
    where: { OR: [{ removedAt: { not: null } }, { notifyEnabled: false }] },
    select: SELECT,
  })
  const leaks = removed.filter(canNotify)
  console.log(`\nProviders that are removed or notify-disabled: ${removed.length}`)
  console.log(`Of those, canNotify() wrongly returns true:     ${leaks.length}  ${leaks.length === 0 ? '✓' : '✗ MISMATCH'}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
