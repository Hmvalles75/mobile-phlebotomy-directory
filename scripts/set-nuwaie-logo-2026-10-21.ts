/** 2026-10-21: Lenice Roberson (NuWaie Care Collective, Louisville KY) emailed her logo; file added by Hector. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmvh33h3n0000l507fbmmoeeb', LOGO = '/images/NuWaie_Logo.png'
async function main() {
  await runAsActor('admin', 'scripts/set-nuwaie-logo-2026-10-21.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  console.log('logo now:', (await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } }))?.logo)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
