// One-off 2026-09-28: the scraped stub for QuantumLab (Lakewood, WA) is the
// business that signed the network agreement on 2026-08-21. Rename to the
// name on the agreement, .org website, contact email, VERIFIED. City stays
// Lakewood, WA (not confirmed). Executed NCA coverage noted in the description.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const EMAIL = 'Inhomelab@quantummobilesolutions.org'
async function main() {
  const p = await prisma.provider.findUnique({ where: { slug: 'quantumlab-solutions-mobile-phlebotomy-services' }, select: { id: true, name: true, status: true, website: true, email: true } })
  if (!p) throw new Error('not found')
  console.log(`before: ${p.name.trim()} | ${p.status} | ${p.website} | ${p.email || '-'}`)
  await runAsActor('admin', 'scripts/fix-quantumlab-record', () => prisma.provider.update({ where: { id: p.id }, data: {
    name: 'QuantumLab Innovative Solutions', website: 'https://quantummobilesolutions.org', status: 'VERIFIED', claimVerifiedAt: new Date(),
    email: EMAIL, claimEmail: EMAIL, notificationEmail: EMAIL,
    description: 'QuantumLab Innovative Solutions (Quantum Mobile Solutions) provides mobile phlebotomy, in-home lab services, corporate wellness and phlebotomy staffing. Network provider under a signed agreement with executed coverage in North Carolina, South Carolina, Georgia, California, Alabama, Mississippi, Washington and Portland, Oregon.',
  } }))
  console.log(`after:  QuantumLab Innovative Solutions | VERIFIED | https://quantummobilesolutions.org | ${EMAIL}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
