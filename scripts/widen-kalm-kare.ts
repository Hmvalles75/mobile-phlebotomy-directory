import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Keshia Bates (Kalm Kare Mobile Labs, Elkhart IN) replied 2026-08-18 agreeing
 * to widen for Fort Wayne, noting she charges additional fees for the distance.
 * That is entirely hers to set — providers bill patients directly and we take
 * no commission — so it is not a blocker.
 */
async function main() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'Kalm Kare', mode: 'insensitive' } },
    select: { id: true, name: true, serviceRadiusMiles: true, zipCodes: true, eligibleForLeads: true, notifyEnabled: true },
  })
  if (!p) { console.log('not found'); return }
  console.log(`${p.name}  before radius=${p.serviceRadiusMiles}mi  zips=${p.zipCodes}`)
  if (p.serviceRadiusMiles && p.serviceRadiusMiles >= 60) { console.log('  already >= 60mi — no change'); return }
  const after = await prisma.provider.update({
    where: { id: p.id },
    data: { serviceRadiusMiles: 60 },
    select: { serviceRadiusMiles: true, eligibleForLeads: true, notifyEnabled: true },
  })
  console.log(`  after  radius=${after.serviceRadiusMiles}mi   eligible=${after.eligibleForLeads} notify=${after.notifyEnabled}`)

  const lead = await prisma.lead.findFirst({
    where: { zip: '46804', status: 'OPEN' },
    select: { id: true, fullName: true, phone: true, email: true, city: true, state: true, zip: true,
              urgency: true, notes: true, createdAt: true, labPreference: true, hasDoctorOrder: true, paymentMethod: true },
  })
  console.log('\n  Fort Wayne lead still open?', lead ? 'YES' : 'no longer open')
  if (lead) {
    const days = Math.floor((Date.now() - lead.createdAt.getTime()) / 864e5)
    console.log(`    ${lead.fullName} · ${lead.phone} · ${lead.email ?? 'no email'}`)
    console.log(`    ${lead.city}, ${lead.state} ${lead.zip}   ${lead.urgency}   ${days}d old`)
    console.log(`    lab: ${lead.labPreference ?? '—'}   doctor order: ${lead.hasDoctorOrder ?? '—'}   payment: ${lead.paymentMethod ?? '—'}`)
    console.log(`    notes: ${lead.notes ?? '—'}`)
    console.log(`    claim link: https://www.mobilephlebotomy.org/claim/${lead.id}?provider=${p.id}`)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
