import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Where does institutional demand actually enter, and what did those buyers
 * land on? SEO work should follow the pages that already convert this segment,
 * not a guess about what an institutional buyer might search.
 */
async function main() {
  // B2B-shaped leads coming through the ordinary patient form.
  const b2b = await prisma.lead.findMany({
    where: {
      OR: [
        { isHighValue: true },
        { requestType: { in: ['organization', 'business'] } },
        { drawCount: { in: ['4-19', '20+'] } },
        { organizationName: { not: null } },
      ],
    },
    select: {
      id: true, createdAt: true, fullName: true, organizationName: true,
      city: true, state: true, status: true, outcome: true, completedAt: true,
      drawCount: true, requestType: true, isHighValue: true,
      source: true, attributionSource: true, landingPage: true, referrer: true,
      utmSource: true, utmCampaign: true, notes: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log('═'.repeat(92))
  console.log(`B2B-SHAPED LEADS: ${b2b.length}`)
  console.log('═'.repeat(92))
  for (const l of b2b) {
    console.log(`\n${l.createdAt.toISOString().slice(0, 10)}  ${(l.organizationName || l.fullName || '?').slice(0, 40)}  ${l.city}, ${l.state}`)
    console.log(`   draws=${l.drawCount || '-'} type=${l.requestType || '-'} highValue=${l.isHighValue} status=${l.status}`)
    console.log(`   source=${l.source || '-'}  attribution=${l.attributionSource || '-'}  utm=${l.utmSource || '-'}`)
    console.log(`   landing=${l.landingPage || '(not captured)'}`)
    console.log(`   referrer=${(l.referrer || '(none)').slice(0, 70)}`)
    if (l.notes) console.log(`   notes: ${l.notes.slice(0, 120).replace(/\s+/g, ' ')}`)
  }

  // Corporate inquiry form — the dedicated institutional entry point.
  const corp = await prisma.corporateInquiry.findMany({
    select: {
      id: true, createdAt: true, companyName: true, contactName: true,
      email: true, city: true, state: true, employeeCount: true,
      serviceType: true, status: true, message: true,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => [] as any[])

  console.log(`\n${'═'.repeat(92)}`)
  console.log(`CORPORATE INQUIRY FORM SUBMISSIONS: ${corp.length}`)
  console.log('═'.repeat(92))
  for (const c of corp) {
    console.log(`  ${c.createdAt.toISOString().slice(0, 10)}  ${(c.companyName || '?').padEnd(34).slice(0, 34)} ${(c.city || '?')}, ${c.state || '?'}  ${c.serviceType || '-'}  ${c.status || '-'}`)
    if (c.message) console.log(`      "${c.message.slice(0, 110).replace(/\s+/g, ' ')}"`)
  }

  // Signed institutional clients + order volume — the revenue that exists.
  const clients = await prisma.institutionalClient.findMany({
    select: {
      id: true, name: true, createdAt: true,
      _count: { select: { orders: true } },
    },
  })
  console.log(`\n${'═'.repeat(92)}`)
  console.log(`SIGNED INSTITUTIONAL CLIENTS: ${clients.length}`)
  console.log('═'.repeat(92))
  for (const c of clients) {
    console.log(`  ${c.createdAt.toISOString().slice(0, 10)}  ${c.name.padEnd(40).slice(0, 40)} orders=${c._count.orders}`)
  }

  // What landing pages appear at all? Tells us which content pulls anyone.
  const withLanding = await prisma.lead.groupBy({
    by: ['landingPage'],
    _count: { _all: true },
    where: { landingPage: { not: null } },
  })
  console.log(`\n── LANDING PAGES RECORDED ACROSS ALL LEADS ──`)
  for (const r of withLanding.sort((a, b) => b._count._all - a._count._all).slice(0, 20)) {
    console.log(`  ${String(r._count._all).padStart(4)}  ${r.landingPage}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
