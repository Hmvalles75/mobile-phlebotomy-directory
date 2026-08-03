import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'diamond wellness', mode: 'insensitive' } },
        { email: { contains: 'diamondwellnesslv', mode: 'insensitive' } },
        { claimEmail: { contains: 'diamondwellnesslv', mode: 'insensitive' } },
        { notificationEmail: { contains: 'diamondwellnesslv', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true, slug: true, status: true,
      email: true, claimEmail: true, notificationEmail: true, phone: true, phonePublic: true,
      website: true, primaryCity: true, primaryState: true, zipCodes: true, serviceRadiusMiles: true,
      listingTier: true, isFeatured: true, featuredTier: true, priorityRouting: true,
      eligibleForLeads: true, notifyEnabled: true, smsOptInAt: true, smsOptOutAt: true,
      stripeCustomerId: true, premiumPage: true,
      claimVerifiedAt: true, removedAt: true, removedReason: true, doNotRelist: true,
      createdAt: true,
    },
  })

  for (const p of rows) {
    console.log(`\n${'─'.repeat(72)}`)
    console.log(`${p.name}  [${p.slug}]`)
    console.log(`  id:          ${p.id}`)
    console.log(`  status:      ${p.status}   created ${p.createdAt.toISOString().slice(0, 10)}`)
    console.log(`  emails:      ${[p.email, p.claimEmail, p.notificationEmail].filter(Boolean).join(' | ') || '(none)'}`)
    console.log(`  phone:       ${p.phone || '(none)'} / public ${p.phonePublic || '(none)'}`)
    console.log(`  website:     ${p.website || '(none)'}`)
    console.log(`  location:    ${p.primaryCity}, ${p.primaryState}  radius=${p.serviceRadiusMiles}mi  zips=${(p.zipCodes || '').split(',').filter(Boolean).length}`)
    console.log(`  tier:        ${p.listingTier} featured=${p.isFeatured} featuredTier=${p.featuredTier} priority=${p.priorityRouting}`)
    console.log(`  routing:     eligibleForLeads=${p.eligibleForLeads} notifyEnabled=${p.notifyEnabled}`)
    console.log(`  sms:         optIn=${p.smsOptInAt ? 'yes' : 'no'} optOut=${p.smsOptOutAt ? 'yes' : 'no'}`)
    console.log(`  billing:     stripeCustomerId=${p.stripeCustomerId || 'none'}  premiumPage=${p.premiumPage}`)
    console.log(`  claimed:     ${p.claimVerifiedAt ? p.claimVerifiedAt.toISOString().slice(0, 10) : 'no'}`)
    console.log(`  removedAt:   ${p.removedAt ? p.removedAt.toISOString() : 'null'}  reason=${p.removedReason || '-'}  doNotRelist=${p.doNotRelist}`)

    // Anything still in flight that a removal has to account for.
    const [openLeads, notifs90, claims] = await Promise.all([
      prisma.lead.findMany({
        where: { routedToId: p.id, status: { in: ['CLAIMED', 'ROUTING', 'OPEN', 'SCHEDULED', 'NEW'] } },
        select: { id: true, fullName: true, city: true, status: true, claimedAt: true },
      }),
      prisma.leadNotification.count({
        where: { providerId: p.id, createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      }),
      prisma.lead.count({ where: { routedToId: p.id, claimedAt: { not: null } } }),
    ])
    console.log(`  activity:    ${notifs90} notifications (90d), ${claims} claims all-time`)
    if (openLeads.length) {
      console.log(`  ⚠ IN-FLIGHT LEADS (${openLeads.length}) — must be reassigned before removal:`)
      for (const l of openLeads) console.log(`      ${l.id} ${l.fullName} ${l.city} ${l.status}`)
    } else {
      console.log(`  in-flight:   none`)
    }
  }
  if (!rows.length) console.log('No matching provider found.')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
