// One-off 2026-11-18: six hospital / walk-in lab records that escaped the
// 2026-08-21 isFixedSite quarantine and are indexed with "Mobile Phlebotomy"
// titles (GSC). Flagging them routes them through the existing fixed-site
// rule: noindex, out of the sitemap, off city/state lists and out of lead
// matching. No emails.
//   npx tsx --env-file=.env.local scripts/flag-fixed-site-2026-11-18.ts [--apply]
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const APPLY = process.argv.includes('--apply')
const SLUGS = ['watsonville-center-lab', 'st-peter-s-laboratory', 'nordx', 'highlands-arh-lab', 'patel-labs-quest', 'any-lab-test-now-with-arcpoint-labs']
async function main() {
  const rows = await prisma.provider.findMany({ where: { slug: { in: SLUGS } }, select: { id: true, slug: true, name: true, isFixedSite: true, eligibleForLeads: true, notifyEnabled: true, primaryCity: true, primaryState: true, _count: { select: { leadNotifications: true, leads: true } } } })
  for (const s of SLUGS) { const r = rows.find(x => x.slug === s); console.log(r ? `  ${s.padEnd(40)} ${r.name} | ${r.primaryCity ?? '-'}, ${r.primaryState ?? '-'} | isFixedSite=${r.isFixedSite} eligible=${r.eligibleForLeads} notify=${r.notifyEnabled} notifs=${r._count.leadNotifications} claimed=${r._count.leads}` : `  ${s}: NOT FOUND`) }
  const todo = rows.filter(r => !r.isFixedSite)
  console.log(`\n${todo.length} to flag`)
  if (!APPLY) { console.log('dry run; add --apply'); return }
  await runAsActor('admin', 'scripts/flag-fixed-site-2026-11-18.ts', async () => {
    for (const r of todo) await prisma.provider.update({ where: { id: r.id }, data: { isFixedSite: true } })
  })
  console.log('applied')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
