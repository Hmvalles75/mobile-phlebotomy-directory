/** 2026-10-20: Kelsie Asp (Precision Mobile, Mesa AZ) sent her logo as a PDF; rendered to PNG at 200 dpi. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmvfub02d001qjp064ikveynt', LOGO = '/images/Precision-Mobile-Draw-logo.png'
async function main() {
  await runAsActor('admin', 'scripts/set-precision-mobile-az-logo-2026-10-20.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  const a = await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } })
  console.log('logo now:', a?.logo)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
