import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Picks the waterfall escalation window empirically instead of by feel.
 *
 * The question is: after a provider is notified, how long is it worth waiting
 * before widening to the next ring? Wait too long and the patient goes cold;
 * too short and every lead is a blast, which defeats the point of rings.
 *
 * Measured from FIRST NOTIFICATION (not lead creation) to claim, because the
 * clock a ring controls starts when the provider is told.
 */
async function main() {
  const leads = await prisma.lead.findMany({
    where: { claimedAt: { not: null } },
    select: {
      id: true, createdAt: true, claimedAt: true, completedAt: true,
      outcome: true, urgency: true, state: true, routedToId: true,
    },
  })

  const firstNotif = new Map<string, Date>()
  for (const r of await prisma.leadNotification.groupBy({
    by: ['leadId'], _min: { createdAt: true },
  })) {
    if (r._min.createdAt) firstNotif.set(r.leadId, r._min.createdAt)
  }

  const rows = leads
    .map(l => {
      const n = firstNotif.get(l.id)
      if (!n || !l.claimedAt) return null
      const mins = (l.claimedAt.getTime() - n.getTime()) / 60000
      if (mins < 0) return null   // claimed before notify — manual assignment
      return {
        mins,
        urgency: l.urgency,
        completed: !!(l.completedAt || l.outcome === 'APPOINTMENT_COMPLETED'),
      }
    })
    .filter(Boolean) as Array<{ mins: number; urgency: string; completed: boolean }>

  const pct = (arr: number[], p: number) => {
    if (!arr.length) return NaN
    const s = [...arr].sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
  }
  const fmt = (m: number) => isNaN(m) ? 'n/a' : m < 60 ? `${m.toFixed(0)}m` : `${(m / 60).toFixed(1)}h`

  const all = rows.map(r => r.mins)
  console.log('═'.repeat(76))
  console.log(`TIME FROM FIRST NOTIFICATION → CLAIM   (n=${rows.length})`)
  console.log('═'.repeat(76))
  for (const p of [10, 25, 50, 75, 90, 95]) {
    console.log(`  p${String(p).padEnd(3)} ${fmt(pct(all, p)).padStart(8)}`)
  }

  // Cumulative capture — the number that actually sets the window.
  console.log('\n── CUMULATIVE SHARE OF CLAIMS BY ELAPSED TIME ──')
  const marks = [15, 30, 60, 90, 120, 180, 240, 360, 480, 720, 1440, 2880]
  for (const m of marks) {
    const n = all.filter(x => x <= m).length
    const share = (n / all.length) * 100
    console.log(`  within ${fmt(m).padStart(6)}  ${String(n).padStart(3)}/${all.length}  ${share.toFixed(0).padStart(3)}%  ${'█'.repeat(Math.round(share / 3))}`)
  }

  // Does a slow claim still convert? If late claims never complete, waiting
  // longer buys nothing and the window should be short.
  console.log('\n── COMPLETION RATE BY CLAIM LATENCY ──')
  const bands: Array<[string, number, number]> = [
    ['≤15m', 0, 15], ['15–60m', 15, 60], ['1–2h', 60, 120],
    ['2–4h', 120, 240], ['4–8h', 240, 480], ['8–24h', 480, 1440], ['>24h', 1440, Infinity],
  ]
  for (const [label, lo, hi] of bands) {
    const band = rows.filter(r => r.mins >= lo && r.mins < hi)
    const done = band.filter(r => r.completed).length
    const rate = band.length ? ((done / band.length) * 100).toFixed(0) + '%' : 'n/a'
    console.log(`  ${label.padEnd(8)} n=${String(band.length).padStart(3)}  completed ${String(done).padStart(2)}  ${rate.padStart(5)}`)
  }

  // STAT vs STANDARD — STAT is being blasted, so this is a sanity read only.
  console.log('\n── BY URGENCY ──')
  for (const u of ['STANDARD', 'STAT']) {
    const band = rows.filter(r => r.urgency === u).map(r => r.mins)
    if (!band.length) { console.log(`  ${u}: none`); continue }
    console.log(`  ${u.padEnd(9)} n=${String(band.length).padStart(3)}  p50=${fmt(pct(band, 50)).padStart(7)}  p75=${fmt(pct(band, 75)).padStart(7)}  p90=${fmt(pct(band, 90)).padStart(7)}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
