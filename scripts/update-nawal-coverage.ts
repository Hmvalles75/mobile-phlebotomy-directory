import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Nawal Isa (Exceptional Mobile Phlebotomy, Midlothian VA) replied 2026-08-18:
 * radius to 75 miles, and lead notifications to her business address rather
 * than the personal gmail her listing was created with.
 */
async function main() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'Exceptional Mobile', mode: 'insensitive' } },
    select: { id: true, name: true, serviceRadiusMiles: true, notificationEmail: true, claimEmail: true, email: true, zipCodes: true },
  })
  if (!p) { console.log('not found'); return }
  console.log(`${p.name}`)
  console.log(`  before: radius=${p.serviceRadiusMiles}mi  notificationEmail=${p.notificationEmail ?? '(none)'}  email=${p.email}`)

  const after = await prisma.provider.update({
    where: { id: p.id },
    data: {
      serviceRadiusMiles: 75,
      notificationEmail: 'exceptionalmobilephlebotomyrva@gmail.com',
      claimEmail: 'exceptionalmobilephlebotomyrva@gmail.com',
    },
    select: { serviceRadiusMiles: true, notificationEmail: true, claimEmail: true, email: true, eligibleForLeads: true, notifyEnabled: true },
  })
  console.log(`  after : radius=${after.serviceRadiusMiles}mi  notificationEmail=${after.notificationEmail}`)
  console.log(`          claimEmail=${after.claimEmail}   signup email left as ${after.email}`)
  console.log(`          eligible=${after.eligibleForLeads} notify=${after.notifyEnabled}`)

  const leads = await prisma.lead.findMany({
    where: { zip: { in: ['23664', '23666'] }, status: 'OPEN' },
    select: { id: true, fullName: true, phone: true, email: true, city: true, state: true, zip: true,
              urgency: true, notes: true, createdAt: true, labPreference: true, hasDoctorOrder: true, paymentMethod: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`\n  open Hampton leads: ${leads.length}`)
  for (const l of leads) {
    const days = Math.floor((Date.now() - l.createdAt.getTime()) / 864e5)
    console.log(`\n    ${l.fullName} — ${l.city}, ${l.state} ${l.zip}  (${days}d old, ${l.urgency})`)
    console.log(`      lab: ${l.labPreference ?? '—'}   doctor order: ${l.hasDoctorOrder ?? '—'}   payment: ${l.paymentMethod ?? '—'}`)
    console.log(`      notes: ${l.notes || '(none)'}`)
    console.log(`      claim: https://www.mobilephlebotomy.org/claim/${l.id}?provider=${p.id}`)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
