/** 2026-10-20: Kelsie Asp (Precision Mobile, Mesa AZ) emailed her price list. No structured pricing field
 * exists yet, so it goes at the end of the description, the same way Shaykila's was added. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmvfub02d001qjp064ikveynt'
const PRICING = `Pricing:
Standard mobile blood draw: $65
STAT or urgent blood draw: $95
Additional patient at the same location: $25
Extended mileage fee: $25
Specimen pickup only: $45`
async function main() {
  const p = await prisma.provider.findUnique({ where: { id: ID }, select: { description: true } })
  if (!p) throw new Error('not found')
  if (p.description?.includes('Standard mobile blood draw: $65')) { console.log('already present'); return }
  await runAsActor('admin', 'scripts/add-kelsie-pricing-2026-10-20.ts', () => prisma.provider.update({ where: { id: ID }, data: { description: `${(p.description || '').trim()}\n\n${PRICING}` } }))
  console.log('added')
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
