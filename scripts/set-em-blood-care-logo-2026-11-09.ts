/**
 * 2026-11-09: Elena Martinez (EM Blood Care Services, Lehigh Acres FL) emailed her flyer as a logo;
 * the logo slot gets a square crop of her photo from it. The flyer says Mon-Fri, so Saturday comes off her hours.
 */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const ID = 'cmw5btnt3000rjq08yd92euhi', LOGO = '/images/EM_Blood_Care_Photo.jpg', DAYS = 'MON,TUE,WED,THU,FRI'
async function main() {
  await runAsActor('admin', 'scripts/set-em-blood-care-logo-2026-11-09.ts', () => prisma.provider.update({ where: { id: ID }, data: { logo: LOGO, operatingDays: DAYS } }))
  console.log(await prisma.provider.findUnique({ where: { id: ID }, select: { logo: true, operatingDays: true, operatingHoursStart: true, operatingHoursEnd: true } }))
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
