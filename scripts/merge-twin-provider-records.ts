// One-off 2026-09-25: two provider records exist under a trailing-hyphen slug
// and a clean slug for the same business. Keep the record with real activity,
// merge what it lacks from the other, soft-remove the other (never delete),
// and 301 the removed slug in next.config.mjs (separate commit).
//   npx tsx scripts/merge-twin-provider-records.ts [--apply]
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
import { citySlug } from '../lib/city-normalize'

const apply = process.argv.includes('--apply')

const PLAN = [
  {
    keep: 'evergreene-mobile-phlebotomy', remove: 'evergreene-mobile-phlebotomy-',
    patch: {} as Record<string, unknown>,
    why: 'clean record has 19 lead notifications, website, claim email and a real ZIP/radius; the "-" record adds nothing',
  },
  {
    keep: 'precision-mobile-phlebotomy-llc', remove: 'precision-mobile-phlebotomy-llc-',
    // Owner-claimed record (claimVerifiedAt 2026-05-23, 12 services, ZIP-only routing list) but no city
    // and eligibleForLeads false; the "-" twin has been receiving leads to an address with notifications off.
    patch: { primaryCity: 'Philadelphia', primaryCitySlug: citySlug('Philadelphia'), primaryState: 'PA', eligibleForLeads: true, description: null as string | null },
    why: 'clean record is the owner-claimed one; copy city + the longer description from the "-" record and turn leads on so they reach the owner',
  },
]

async function main() {
  for (const p of PLAN) {
    const [keep, remove] = await Promise.all([
      prisma.provider.findUnique({ where: { slug: p.keep }, select: { id: true, name: true, description: true, primaryCity: true, primaryState: true, eligibleForLeads: true, removedAt: true } }),
      prisma.provider.findUnique({ where: { slug: p.remove }, select: { id: true, name: true, description: true, removedAt: true } }),
    ])
    if (!keep || !remove) throw new Error(`missing record for ${p.keep} / ${p.remove}`)
    const patch = { ...p.patch }
    if ('description' in patch && patch.description === null) patch.description = (remove.description || '').length > (keep.description || '').length ? remove.description : keep.description
    console.log(`\n== ${keep.name.trim()} ==\n  keep   /provider/${p.keep}  (${keep.id})\n  remove /provider/${p.remove}  (${remove.id})${remove.removedAt ? '  ALREADY REMOVED' : ''}\n  why    ${p.why}`)
    if (Object.keys(patch).length) console.log('  patch on kept record:', JSON.stringify(patch).slice(0, 220))
    if (!apply || remove.removedAt) continue
    await runAsActor('admin', 'scripts/merge-twin-provider-records', async () => {
      if (Object.keys(patch).length) await prisma.provider.update({ where: { id: keep.id }, data: patch as any })
      await prisma.provider.update({ where: { id: remove.id }, data: { removedAt: new Date(), removedReason: `duplicate of /provider/${p.keep} (merged 2026-09-25)`, doNotRelist: true, eligibleForLeads: false, notifyEnabled: false } })
    })
    console.log('  applied')
  }
  console.log(apply ? '\ndone' : '\ndry run; add --apply')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
