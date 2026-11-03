/** 2026-11-03: DrawVera Mobile Labs (Orlando FL) sent a headshot with the logo in the corner; the logo slot gets the round badge cropped from it. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmuegk4780007l304sli8kdwh', LOGO = '/images/DrawVera_Badge_Logo.png'
async function main() {
  await runAsActor('admin', 'scripts/set-drawvera-logo-2026-11-03.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  console.log('logo now:', (await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } }))?.logo)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
