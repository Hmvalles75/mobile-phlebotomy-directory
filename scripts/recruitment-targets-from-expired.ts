// Read-only. OPEN leads older than 14 days that never reached a provider: the
// set the (now working) expire-stale-leads cron will close on its first run.
// Grouped by city/state as a recruitment target list, separate from the live
// NEEDS_COVERAGE queue the coverage sweep produces going forward.
//   npx tsx scripts/recruitment-targets-from-expired.ts [--out path.md]
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'

const prisma = new PrismaClient()
const STALE_DAYS = 14
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/,?\s*[A-Za-z]{2}$/i, (m) => m).replace(/\b\w/g, c => c.toUpperCase())

async function main() {
  const cutoff = new Date(Date.now() - STALE_DAYS * 86400000)
  const leads = await prisma.lead.findMany({
    where: { status: 'OPEN', createdAt: { lt: cutoff }, leadNotifications: { none: {} } },
    select: { city: true, state: true, zip: true, createdAt: true, isHighValue: true, urgency: true },
    orderBy: { createdAt: 'asc' },
  })

  const byCity = new Map<string, { n: number; zips: Set<string>; first: Date; last: Date; hv: number }>()
  const byState = new Map<string, number>()
  for (const l of leads) {
    const key = `${norm(l.city)}, ${l.state.toUpperCase()}`
    const e = byCity.get(key) || { n: 0, zips: new Set<string>(), first: l.createdAt, last: l.createdAt, hv: 0 }
    e.n++; e.zips.add(l.zip); if (l.createdAt < e.first) e.first = l.createdAt; if (l.createdAt > e.last) e.last = l.createdAt; if (l.isHighValue) e.hv++
    byCity.set(key, e)
    byState.set(l.state.toUpperCase(), (byState.get(l.state.toUpperCase()) || 0) + 1)
  }
  const d = (x: Date) => x.toISOString().slice(0, 10)
  const cities = [...byCity.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))
  const states = [...byState.entries()].sort((a, b) => b[1] - a[1])

  const lines: string[] = []
  lines.push(`# Recruitment targets from unreached leads (${d(new Date())})`)
  lines.push('')
  lines.push(`${leads.length} OPEN leads older than ${STALE_DAYS} days that never reached a provider, ${d(leads[0]?.createdAt ?? new Date())} to ${d(leads.at(-1)?.createdAt ?? new Date())}.`)
  lines.push('These are closed by the expire-stale-leads cron on its first run; this list is the demand they represented.')
  lines.push('')
  lines.push('## By state')
  lines.push('')
  for (const [st, n] of states) lines.push(`- ${st}: ${n}`)
  lines.push('')
  lines.push('## By city')
  lines.push('')
  lines.push('| leads | city | zips | first | last |')
  lines.push('|---|---|---|---|---|')
  for (const [city, e] of cities) lines.push(`| ${e.n}${e.hv ? ` (${e.hv} HV)` : ''} | ${city} | ${[...e.zips].join(', ')} | ${d(e.first)} | ${d(e.last)} |`)
  const out = lines.join('\n') + '\n'
  console.log(out)

  const i = process.argv.indexOf('--out')
  if (i > -1 && process.argv[i + 1]) { writeFileSync(process.argv[i + 1], out); console.log(`written to ${process.argv[i + 1]}`) }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
