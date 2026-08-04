import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * "Backfill the ZIP table" turns out to be three unrelated jobs. Separating
 * them matters because only one is a geocoding problem.
 *
 *   A. GARBAGE   — the value is not a ZIP at all (Place IDs, scraped page
 *                  text, image paths, emails). A scraper wrote it.
 *   B. FABRICATED— 5 digits but no such ZIP exists (80000, 36999, 72999).
 *                  Someone approximating statewide coverage by hand.
 *   C. MISSING   — a real, current ZIP absent from zipcodes@8.0.0, whose
 *                  data predates it. Only these are a true table gap.
 */
const zipcodes = require('zipcodes')

function classify(raw: string): 'GARBAGE' | 'FABRICATED' | 'MISSING' {
  const v = raw.trim()
  if (!/^\d{5}$/.test(v)) return 'GARBAGE'
  // A real ZIP has neighbours sharing its 3-digit prefix. A fabricated one
  // usually sits in a prefix that exists but at an unused number, so also
  // check whether the package knows ANY zip in that prefix.
  const prefix = v.slice(0, 3)
  const siblings = Object.keys(zipcodes.codes || {}).filter(z => z.startsWith(prefix))
  if (siblings.length === 0) return 'FABRICATED'
  // Heuristic: trailing 99/00 patterns in an otherwise-populated prefix are
  // hand-entered range markers, not real delivery areas.
  if (/(99|00)$/.test(v) && !zipcodes.lookup(v)) return 'FABRICATED'
  return 'MISSING'
}

/** Nearest known ZIP sharing the 3-digit prefix — same postal sectional centre. */
function nearestKnown(zip: string): { zip: string; city: string; state: string; lat: number; lng: number } | null {
  const prefix = zip.slice(0, 3)
  const target = parseInt(zip, 10)
  const siblings = Object.keys(zipcodes.codes || {})
    .filter(z => z.startsWith(prefix))
    .map(z => ({ z, d: Math.abs(parseInt(z, 10) - target) }))
    .sort((a, b) => a.d - b.d)
  for (const s of siblings) {
    const info = zipcodes.lookup(s.z)
    if (info?.latitude && info?.longitude) {
      return { zip: s.z, city: info.city, state: info.state, lat: info.latitude, lng: info.longitude }
    }
  }
  return null
}

async function main() {
  const leads = await prisma.lead.findMany({ select: { zip: true, city: true, state: true } })
  const provs = await prisma.provider.findMany({
    where: { removedAt: null },
    select: { id: true, name: true, zipCodes: true, primaryCity: true, primaryState: true, eligibleForLeads: true },
  })

  const seen = new Map<string, { sources: string[]; city?: string; state?: string }>()
  for (const l of leads) {
    if (l.zip && !getZipInfo(l.zip)) {
      const e = seen.get(l.zip) || { sources: [], city: l.city || undefined, state: l.state || undefined }
      e.sources.push('lead'); seen.set(l.zip, e)
    }
  }
  for (const p of provs) {
    for (const z of (p.zipCodes || '').split(',').map(s => s.trim()).filter(Boolean)) {
      if (!getZipInfo(z)) {
        const e = seen.get(z) || { sources: [], city: p.primaryCity || undefined, state: p.primaryState || undefined }
        e.sources.push(`provider:${p.name.slice(0, 24)}`); seen.set(z, e)
      }
    }
  }

  const buckets: Record<string, Array<[string, any]>> = { GARBAGE: [], FABRICATED: [], MISSING: [] }
  for (const [zip, meta] of seen) buckets[classify(zip)].push([zip, meta])

  for (const k of ['MISSING', 'FABRICATED', 'GARBAGE']) {
    console.log(`\n${'═'.repeat(78)}`)
    console.log(`${k}: ${buckets[k].length}`)
    console.log('═'.repeat(78))
    for (const [zip, meta] of buckets[k].slice(0, 30)) {
      const label = zip.length > 22 ? zip.slice(0, 22) + '…' : zip
      if (k === 'MISSING') {
        const near = nearestKnown(zip)
        console.log(`  ${label.padEnd(24)} ${(meta.city || '?')}, ${meta.state || '?'}`)
        console.log(`      nearest known: ${near ? `${near.zip} ${near.city}, ${near.state} (${near.lat.toFixed(3)}, ${near.lng.toFixed(3)})` : 'NONE'}`)
      } else {
        console.log(`  ${label.padEnd(24)} ${meta.sources.slice(0, 2).join(', ')}`)
      }
    }
    if (buckets[k].length > 30) console.log(`  … and ${buckets[k].length - 30} more`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
