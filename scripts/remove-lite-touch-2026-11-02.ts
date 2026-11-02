/** 2026-11-02: Christibell Alphonso (Lite Touch Mobile Phlebotomy Services, Jamaica NY) asked through
 *  /contact to have her business removed. The record was a SCRAPED, UNVERIFIED stub: never claimed,
 *  never routed a request. Soft removal per the established pattern; /provider/<slug> returns 410
 *  from middleware.ts. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmit2wf3q00cig0m0umwqt4kw'
async function main() {
  const b = await prisma.provider.findUnique({ where: { id: ID }, select: { name: true, slug: true, removedAt: true, doNotRelist: true, eligibleForLeads: true } })
  console.log('before:', JSON.stringify(b))
  if (b?.removedAt) { console.log('already removed'); return }
  await runAsActor('admin', 'scripts/remove-lite-touch-2026-11-02.ts', () => prisma.provider.update({ where: { id: ID }, data: { removedAt: new Date(), removedReason: 'owner request 2026-11-02 via /contact: not affiliated, remove listing', doNotRelist: true, eligibleForLeads: false, notifyEnabled: false } }))
  console.log('after: ', JSON.stringify(await prisma.provider.findUnique({ where: { id: ID }, select: { removedAt: true, removedReason: true, doNotRelist: true, eligibleForLeads: true, notifyEnabled: true } })))
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
