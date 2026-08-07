import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * Read-only. The SF page now claims 28 providers with zero SF-specific
 * coverage, so every one of them qualifies via a statewide CA row or a CA
 * primaryState. This asks whether they are actually NorCal-capable or SoCal
 * providers with a statewide checkbox.
 */
const SF_ZIP = '94102'

async function main() {
  // Mirrors the generator's counting logic exactly.
  const provs = await prisma.provider.findMany({
    where: {
      eligibleForLeads: true,
      removedAt: null,
      OR: [
        { coverage: { some: { state: { abbr: 'CA' }, cityId: null } } },
        { primaryState: 'CA' },
      ],
    },
    select: {
      name: true, primaryCity: true, primaryState: true,
      zipCodes: true, serviceRadiusMiles: true,
      coverage: { select: { state: { select: { abbr: true } }, city: { select: { name: true } } } },
    },
  })

  const rows = provs.map(p => {
    const zip = (p.zipCodes || '').split(',').map(s => s.trim()).filter(s => s.length >= 5)[0] || null
    const dist = zip ? getDistanceBetweenZips(zip, SF_ZIP) : null
    const radius = p.serviceRadiusMiles || 25
    const reaches = dist !== null && dist <= radius
    const covType = p.coverage.some(c => c.state.abbr === 'CA' && c.city === null)
      ? 'CA statewide'
      : p.primaryState === 'CA' ? 'primaryState CA' : 'other'
    return { name: p.name, city: p.primaryCity || '?', zip, dist, radius, reaches, covType }
  }).sort((a, b) => (a.dist ?? 99999) - (b.dist ?? 99999))

  console.log(`Providers the SF page counts: ${rows.length}\n`)
  console.log('PROVIDER'.padEnd(38) + 'BASE'.padEnd(20) + 'ZIP'.padEnd(8) + 'MI'.padEnd(7) + 'RADIUS'.padEnd(8) + 'REACHES SF'.padEnd(12) + 'COVERAGE')
  console.log('─'.repeat(110))
  for (const r of rows) {
    console.log(
      r.name.padEnd(38).slice(0, 38) +
      `${r.city}`.padEnd(20).slice(0, 20) +
      (r.zip || '—').padEnd(8) +
      (r.dist === null ? '—' : r.dist.toFixed(0)).padEnd(7) +
      `${r.radius}mi`.padEnd(8) +
      (r.reaches ? 'YES' : 'no').padEnd(12) +
      r.covType
    )
  }

  const reach = rows.filter(r => r.reaches).length
  const within50 = rows.filter(r => r.dist !== null && r.dist <= 50).length
  const socal = rows.filter(r => r.dist !== null && r.dist > 300).length
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  Advertised on the page:                 ${rows.length}`)
  console.log(`  Actually reach SF within their radius:  ${reach}`)
  console.log(`  Based within 50 miles of SF:            ${within50}`)
  console.log(`  Based >300 miles away (SoCal):          ${socal}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
