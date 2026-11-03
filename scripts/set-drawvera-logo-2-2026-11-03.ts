/** 2026-11-03: DrawVera sent the clean logo file; replaces the badge cropped from his headshot earlier today. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmuegk4780007l304sli8kdwh', LOGO = '/images/DrawVera-Logo-2.jpeg'
async function main() {
  await runAsActor('admin', 'scripts/set-drawvera-logo-2-2026-11-03.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  console.log('logo now:', (await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } }))?.logo)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
