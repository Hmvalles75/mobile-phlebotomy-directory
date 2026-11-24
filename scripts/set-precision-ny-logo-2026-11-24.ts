/** 2026-11-24: Precision Mobile Phlebotomy Services – Long Island sent their logo; the square icon mark goes in the logo slot (the wide lockup would render as a strip in the 160px square). Run after the PNG is deployed. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmv6yw4ae0000g0w0gkacdxmh', LOGO = '/images/Precision-Mobile-Phlebotomy-Services-Logo.png'
async function main() {
  await runAsActor('admin', 'scripts/set-precision-ny-logo-2026-11-24.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  console.log('logo now:', (await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } }))?.logo)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
