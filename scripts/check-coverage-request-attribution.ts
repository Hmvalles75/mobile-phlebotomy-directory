import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const rows = await prisma.coverageRequest.findMany({ orderBy: { createdAt: 'desc' } })
  console.log('ORG'.padEnd(36) + 'LANDING PAGE'.padEnd(34) + 'ATTRIB'.padEnd(12) + 'REFERRER')
  console.log('─'.repeat(120))
  for (const r of rows as any[]) {
    console.log(
      String(r.organizationName || '?').slice(0, 35).padEnd(36) +
      String(r.landingPage || '(not captured)').slice(0, 33).padEnd(34) +
      String(r.attributionSource || '-').padEnd(12) +
      String(r.referrer || '-').slice(0, 40)
    )
  }
  console.log('\n── volume / timeline / states ──')
  for (const r of rows as any[]) {
    console.log(`  ${String(r.organizationName || '?').slice(0,34).padEnd(35)} vol=${String(r.estimatedVolume||'-').padEnd(14)} timeline=${String(r.timeline||'-').padEnd(16)} states=${String(r.statesNeeded||'-').slice(0,28)}`)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
