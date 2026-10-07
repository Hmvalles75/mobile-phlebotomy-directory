/** 2026-10-07: Intuitive Hands Mobile Phlebotomy sent their logo by email (Candace Parker); file added by Hector. */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmuvqv4w3001mkw0454yy5eem', LOGO = '/images/Intuitive-Hands-logo.jpeg'
async function main() {
  const b = await prisma.provider.findUnique({ where: { id: ID }, select: { name: true, logo: true } })
  console.log(`${b?.name}\nbefore: logo ${b?.logo}`)
  await runAsActor('admin', 'scripts/set-intuitive-hands-logo-2026-10-07.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO } }))
  const a = await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true } })
  console.log(`after:  logo ${a?.logo}`)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
