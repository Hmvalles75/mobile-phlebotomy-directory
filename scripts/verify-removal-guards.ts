import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Read-only rehearsal of POST /api/admin/providers/[id]/remove.
 * Mutates nothing — it just reports what each guard would decide.
 */
const IN_FLIGHT = ['CLAIMED', 'ROUTING', 'SCHEDULED'] as const

function redirectFor(p: { primaryStateSlug: string | null; primaryCitySlug: string | null }) {
  if (p.primaryStateSlug && p.primaryCitySlug) return `/us/${p.primaryStateSlug}/${p.primaryCitySlug}`
  if (p.primaryStateSlug) return `/us/${p.primaryStateSlug}`
  return '/search'
}

async function main() {
  const providers = await prisma.provider.findMany({
    select: {
      id: true, name: true, slug: true, removedAt: true,
      primaryStateSlug: true, primaryCitySlug: true,
    },
  })

  const inFlightCounts = await prisma.lead.groupBy({
    by: ['routedToId'],
    _count: { _all: true },
    where: {
      status: { in: IN_FLIGHT as unknown as any[] },
      routedToId: { not: null },
      completedAt: null,
    },
  })
  const blocked = new Map(inFlightCounts.map(r => [r.routedToId!, r._count._all]))

  const alreadyRemoved = providers.filter(p => p.removedAt)
  const wouldBlock = providers.filter(p => !p.removedAt && (blocked.get(p.id) || 0) > 0)
  const wouldSucceed = providers.filter(p => !p.removedAt && (blocked.get(p.id) || 0) === 0)

  console.log('═'.repeat(88))
  console.log('REMOVAL GUARD REHEARSAL (read-only — nothing is modified)')
  console.log('═'.repeat(88))
  console.log(`\nTotal providers:                       ${providers.length}`)
  console.log(`Would 409 "already removed":           ${alreadyRemoved.length}`)
  console.log(`Would warn (needs confirm):            ${wouldBlock.length}`)
  console.log(`Would succeed:                         ${wouldSucceed.length}`)

  console.log(`\n── WOULD WARN — claimed leads outstanding (admin can confirm past it) ──`)
  for (const p of wouldBlock) {
    console.log(`  ${p.name.padEnd(46).slice(0, 46)} ${String(blocked.get(p.id)).padStart(3)} live lead(s)`)
  }
  if (!wouldBlock.length) console.log('  (none)')

  console.log(`\n── ALREADY REMOVED (route refuses, restore available) ──`)
  for (const p of alreadyRemoved) {
    console.log(`  ${p.name.padEnd(46).slice(0, 46)} removed ${p.removedAt!.toISOString().slice(0, 10)}`)
  }

  console.log(`\n── SAMPLE REDIRECT SUGGESTIONS ──`)
  for (const p of wouldSucceed.slice(0, 5)) {
    console.log(`  /provider/${p.slug}`)
    console.log(`     → ${redirectFor(p)}`)
  }

  // Reason validation is pure — assert it here so the rule is pinned down.
  const cases: Array<[string, boolean]> = [
    ['', false], ['   ', false], ['oops', false], ['test', false],
    ['Provider request 2026-08-04', true],
  ]
  console.log(`\n── REASON VALIDATION (min 5 chars after trim) ──`)
  for (const [input, expected] of cases) {
    const actual = input.trim().length >= 5
    console.log(`  ${JSON.stringify(input).padEnd(32)} accepted=${String(actual).padEnd(5)} ${actual === expected ? '✓' : '✗ MISMATCH'}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
