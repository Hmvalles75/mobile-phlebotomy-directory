import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getDistanceBetweenZips, getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'Resolute', mode: 'insensitive' } },
    select: {
      id: true, name: true, slug: true, status: true,
      email: true, claimEmail: true, notificationEmail: true,
      phone: true, phonePublic: true,
      primaryCity: true, primaryState: true, zipCodes: true, serviceRadiusMiles: true,
      eligibleForLeads: true, notifyEnabled: true, removedAt: true,
      listingTier: true, isFeatured: true, priorityRouting: true,
      coverage: { include: { state: { select: { abbr: true } }, city: { select: { name: true } } } },
    },
  })
  if (!p) { console.log('not found'); return }

  console.log(`${p.name} [${p.slug}]  id=${p.id}`)
  console.log(`  status:            ${p.status}`)
  console.log(`  email:             ${p.email || '(none)'}`)
  console.log(`  claimEmail:        ${p.claimEmail || '(none)'}`)
  console.log(`  notificationEmail: ${p.notificationEmail || '(NOT SET)'}`)
  console.log(`  → leads actually go to: ${p.notificationEmail || p.claimEmail || p.email || 'NOWHERE'}`)
  console.log(`  base:              ${p.primaryCity}, ${p.primaryState}  zips=${p.zipCodes}  radius=${p.serviceRadiusMiles}mi`)
  console.log(`  eligibleForLeads:  ${p.eligibleForLeads}  notifyEnabled=${p.notifyEnabled}  removedAt=${p.removedAt ? 'SET' : 'null'}`)
  console.log(`  tier:              ${p.listingTier} featured=${p.isFeatured} priority=${p.priorityRouting}`)
  console.log(`  coverage:          ${p.coverage.map(c => `${c.state.abbr}${c.city ? '/' + c.city.name : ' statewide'}`).join(', ')}`)

  // Does their radius reach the Upper Marlboro lead?
  const primaryZip = (p.zipCodes || '').split(',').map(s => s.trim()).filter(s => s.length >= 5)[0]
  const d = primaryZip ? getDistanceBetweenZips(primaryZip, '20772') : null
  console.log(`\n  Upper Marlboro 20772 (${getZipInfo('20772')?.city}): ${d === null ? 'distance unknown' : d.toFixed(0) + ' mi'} — within ${p.serviceRadiusMiles}mi? ${d !== null && d <= (p.serviceRadiusMiles || 25)}`)

  // Was a notification actually created and sent for that lead?
  const lead = await prisma.lead.findFirst({
    where: { zip: '20772', createdAt: { gte: new Date(Date.now() - 3 * 86400000) } },
    select: { id: true, createdAt: true, city: true, state: true, status: true, routedToId: true, routedProviderIds: true, claimedAt: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`\n  Recent 20772 lead: ${lead ? `${lead.id} ${lead.createdAt.toISOString()} status=${lead.status}` : '(none in last 3 days)'}`)
  if (lead) {
    console.log(`     routedTo=${lead.routedToId}  routedProviderIds=${lead.routedProviderIds.length}  claimedAt=${lead.claimedAt?.toISOString() || 'unclaimed'}`)
    const notifs = await prisma.leadNotification.findMany({
      where: { leadId: lead.id },
      select: { providerId: true, status: true, sentAt: true, errorMessage: true, createdAt: true },
    })
    console.log(`\n  Notifications for that lead: ${notifs.length}`)
    const ids = notifs.map(n => n.providerId)
    const names = new Map((await prisma.provider.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map(x => [x.id, x.name]))
    for (const n of notifs) {
      const mine = n.providerId === p.id ? '  ← RESOLUTE' : ''
      console.log(`     ${(names.get(n.providerId) || n.providerId).slice(0, 34).padEnd(36)} ${n.status.padEnd(8)} sent=${n.sentAt ? n.sentAt.toISOString().slice(11, 19) : '—'} ${n.errorMessage || ''}${mine}`)
    }
  }

  // Their overall notification history — is delivery failing generally?
  const hist = await prisma.leadNotification.findMany({
    where: { providerId: p.id },
    select: { createdAt: true, status: true, errorMessage: true },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })
  console.log(`\n  Their last ${hist.length} notifications:`)
  for (const h of hist) {
    console.log(`     ${h.createdAt.toISOString().slice(0, 16)}  ${h.status.padEnd(8)} ${h.errorMessage || ''}`)
  }
  const failed = await prisma.leadNotification.count({ where: { providerId: p.id, status: 'FAILED' } })
  console.log(`\n  FAILED notifications all-time: ${failed}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
