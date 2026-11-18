// One-off 2026-11-18 (batch 2): twenty more fixed-site records Hector approved
// after the candidate review: 16 hospital / health-system outpatient draw
// stations, 3 ARCpoint franchises and one Any Lab Test Now. Same effect as
// batch 1: noindex, out of the sitemap, off city/state lists. Held for review
// and deliberately NOT here: guardian-labs-phlebotomy-school,
// pathway-clinical-institute, physicians-preferred-laboratory, apex-laboratory,
// apex-laboratory-inc, aculabs-inc, stat-laboratory, interpath-laboratory-inc,
// meridian-laboratory, lincoln-reference-laboratory, patient-service-center.
//   npx tsx --env-file=.env.local scripts/flag-fixed-site-batch2-2026-11-18.ts [--apply]
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const APPLY = process.argv.includes('--apply')
const SLUGS = [
  'diagnostic-center-and-laboratory-medicine-at-gbmc',
  'emerson-health-lab-concord',
  'laboratory-services-mountain-view-el-camino-health',
  'northwell-health-labs-at-242-mason-avenue',
  'northwell-health-labs-at-plainview',
  'legacy-laboratory-services-good-samaritan-building-3-patient-service-center',
  'phlebotomy-lab-at-north-dartmouth',
  'st-peter-s-laboratory-hackett-blvd',
  'terrebonne-general-outpatient-laboratory',
  'ur-medicine-labs-rochester-culver-road',
  'upstate-pathology-laboratory',
  'vanderbilt-laboratory-services',
  'vanderbilt-laboratory-services-central-one-hundred-oaks',
  'versiti-blood-center-of-michigan',
  'rrh-labs',
  'laboratory-pathology-services',
  'arcpoint-labs-of-houston-northwest',
  'arcpoint-labs-of-katy',
  'arcpoint-labs-of-san-rafael',
  'any-lab-test-now',
]
async function main() {
  if (SLUGS.length !== 20) throw new Error(`expected 20 slugs, have ${SLUGS.length}`)
  const rows = await prisma.provider.findMany({ where: { slug: { in: SLUGS } }, select: { id: true, slug: true, name: true, isFixedSite: true, eligibleForLeads: true, removedAt: true, _count: { select: { leadNotifications: true, leads: true } } } })
  for (const s of SLUGS) { const r = rows.find(x => x.slug === s); console.log(r ? `  ${s.padEnd(76)} isFixedSite=${r.isFixedSite} eligible=${r.eligibleForLeads} notifs=${r._count.leadNotifications} claimed=${r._count.leads}${r.removedAt ? ' REMOVED' : ''}` : `  ${s}: NOT FOUND`) }
  const missing = SLUGS.filter(s => !rows.find(r => r.slug === s))
  if (missing.length) throw new Error(`missing: ${missing.join(', ')}`)
  const todo = rows.filter(r => !r.isFixedSite)
  console.log(`\n${todo.length} to flag`)
  if (!APPLY) { console.log('dry run; add --apply'); return }
  await runAsActor('admin', 'scripts/flag-fixed-site-batch2-2026-11-18.ts', async () => {
    for (const r of todo) await prisma.provider.update({ where: { id: r.id }, data: { isFixedSite: true } })
  })
  console.log('applied')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
