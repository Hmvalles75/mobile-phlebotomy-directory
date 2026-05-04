import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Idempotent: if NeuroAge already exists, reuse; otherwise create.
  let client = await prisma.institutionalClient.findFirst({
    where: { name: 'NeuroAge Therapeutics' },
  })
  if (!client) {
    client = await prisma.institutionalClient.create({
      data: {
        name: 'NeuroAge Therapeutics',
        contactEmail: 'marah@neuroagetx.com',
        ccEmails: 'hello@neuroagetx.com',
      },
    })
    console.log(`✅ Created client: ${client.name} (${client.id})`)
  } else {
    console.log(`Client exists: ${client.name} (${client.id})`)
  }
  console.log(`  client share token: ${client.publicShareToken}`)
  console.log(`  client share URL:   /orders/client/${client.publicShareToken}`)

  // Lookup Stats Phlebotomy provider for assignment
  const stats = await prisma.provider.findFirst({
    where: { name: { contains: 'Stats Phlebotomy', mode: 'insensitive' } },
    select: { id: true, name: true, primaryCity: true, primaryState: true },
  })
  if (!stats) {
    console.warn(`⚠️  Stats Phlebotomy provider not found — order will be created unassigned`)
  } else {
    console.log(`Found provider: ${stats.name} (${stats.id}) | ${stats.primaryCity}, ${stats.primaryState}`)
  }

  // Idempotent: skip if Susan Carr order already exists for this client
  const existing = await prisma.institutionalOrder.findFirst({
    where: { clientId: client.id, patientName: 'Susan Carr' },
  })
  if (existing) {
    console.log(`Order exists: Susan Carr (${existing.id})`)
    console.log(`  order share token: ${existing.publicShareToken}`)
    console.log(`  order share URL:   /orders/${existing.publicShareToken}`)
    await prisma.$disconnect()
    return
  }

  const order = await prisma.institutionalOrder.create({
    data: {
      clientId: client.id,
      patientName: 'Susan Carr',
      patientContactName: 'Romy',
      patientPhone: '312-351-4446',
      patientEmail: 'romycarr2002@gmail.com',
      patientAddress: '8255 Steepleside Drive',
      patientCity: 'Burr Ridge',
      patientState: 'IL',
      patientZip: '60527',
      protocolNotes: 'Dry ice (~6 lbs) sourced by provider, FedEx same-day, Mon-Wed only, no centrifuge',
      clientRate: '125.00',
      providerRate: '75.00',
      kitReceivedAt: new Date('2026-05-01T00:00:00Z'),
      scheduledFor: new Date('2026-05-06T00:00:00Z'),
      status: 'SCHEDULED',
      assignedProviderId: stats?.id ?? null,
    },
  })
  console.log(`✅ Created order: Susan Carr (${order.id})`)
  console.log(`  order share token: ${order.publicShareToken}`)
  console.log(`  order share URL:   /orders/${order.publicShareToken}`)
  console.log(`  status:            ${order.status}`)
  console.log(`  assignedProvider:  ${stats?.name ?? '(unassigned)'}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
