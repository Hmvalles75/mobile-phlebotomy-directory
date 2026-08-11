import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const lead = await prisma.lead.findFirst({
    where: { fullName: { contains: 'Bannon', mode: 'insensitive' } },
    select: {
      id: true, fullName: true, city: true, state: true, zip: true,
      createdAt: true, status: true, urgency: true,
      routedToId: true, routedProviderIds: true,
      claimedAt: true, outcome: true, outcomeNotes: true,
      appointmentDate: true, completedAt: true,
      staleReleaseCount: true,
      firstContactAt: true, callAttempts: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!lead) { console.log('Lead not found'); return }

  console.log('═'.repeat(80))
  console.log(`LEAD: ${lead.fullName} — ${lead.city}, ${lead.state} ${lead.zip}`)
  console.log('═'.repeat(80))
  console.log(`  id:                 ${lead.id}`)
  console.log(`  created:            ${lead.createdAt.toISOString()}`)
  console.log(`  status:             ${lead.status}`)
  console.log(`  claimedAt:          ${lead.claimedAt?.toISOString() || 'not currently claimed'}`)
  console.log(`  outcome:            ${lead.outcome || 'NONE LOGGED'}`)
  console.log(`  appointmentDate:    ${lead.appointmentDate?.toISOString() || 'none'}`)
  console.log(`  completedAt:        ${lead.completedAt?.toISOString() || 'none'}`)
  console.log(`  staleReleaseCount:  ${lead.staleReleaseCount}`)


  const holder = lead.routedToId
    ? await prisma.provider.findUnique({ where: { id: lead.routedToId }, select: { id: true, name: true, email: true, notificationEmail: true, phone: true } })
    : null
  console.log(`\n  CURRENTLY HELD BY: ${holder ? holder.name : 'NOBODY — back in the open pool'}`)
  if (holder) console.log(`     ${holder.notificationEmail || holder.email} · ${holder.phone}`)

  // Who else has been notified since the release? Risk of a double-booking.
  const notifs = await prisma.leadNotification.findMany({
    where: { leadId: lead.id },
    select: { providerId: true, createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  })
  const provs = await prisma.provider.findMany({
    where: { id: { in: notifs.map(n => n.providerId) } },
    select: { id: true, name: true },
  })
  const nameOf = new Map(provs.map(p => [p.id, p.name]))
  console.log(`\n  NOTIFICATION HISTORY (${notifs.length}):`)
  for (const n of notifs) {
    const after = lead.claimedAt && n.createdAt > lead.claimedAt ? '  ← AFTER RELEASE' : ''
    console.log(`     ${n.createdAt.toISOString().slice(0, 16).replace('T', ' ')}  ${(nameOf.get(n.providerId) || '?').slice(0, 36).padEnd(38)} ${n.status}${after}`)
  }

  // Donald's history — is this a pattern or a one-off?
  const donald = await prisma.provider.findFirst({
    where: { name: { contains: 'Precision Care', mode: 'insensitive' } },
    select: { id: true, name: true, staleReleaseCount: true, lastStaleReleaseAt: true, eligibleForLeads: true, notifyEnabled: true },
  })
  if (donald) {
    console.log(`\n${'═'.repeat(80)}`)
    console.log(`PROVIDER: ${donald.name}`)
    console.log('═'.repeat(80))
    console.log(`  provider staleReleaseCount: ${donald.staleReleaseCount}   last: ${donald.lastStaleReleaseAt?.toISOString().slice(0, 10) || 'never'}`)
    const claims = await prisma.lead.findMany({
      where: { routedToId: donald.id },
      select: { fullName: true, city: true, status: true, outcome: true, claimedAt: true, completedAt: true, staleReleaseCount: true },
      orderBy: { claimedAt: 'desc' },
      take: 12,
    })
    console.log(`\n  Their claims (${claims.length}):`)
    for (const c of claims) {
      console.log(`     ${c.claimedAt?.toISOString().slice(0, 10)}  ${(c.fullName || '?').slice(0, 20).padEnd(22)} ${(c.city || '').slice(0, 16).padEnd(18)} ${c.status.padEnd(12)} outcome=${c.outcome || 'NONE'} stale=${c.staleReleaseCount}`)
    }
    const noOutcome = claims.filter(c => !c.outcome).length
    console.log(`\n  Claims with NO outcome logged: ${noOutcome} of ${claims.length}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
