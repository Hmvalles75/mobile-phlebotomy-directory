/**
 * One-shot provider scoring run (same code path as /api/cron/provider-score).
 *   npx tsx scripts/run-provider-scoring.ts          # writes scores
 *   npx tsx scripts/run-provider-scoring.ts --dry    # compute only
 *   npx tsx scripts/run-provider-scoring.ts --report # no scoring run, just the tables
 * Prints run time and the top/bottom 10 with their underlying 90-day numbers.
 */
import { prisma } from '../lib/prisma'
import { runProviderScoring, computeProviderStats, scoreFromStats, MIN_SENT } from '../lib/providerScore'

async function main() {
  const dry = process.argv.includes('--dry')
  if (!process.argv.includes('--report')) {
    const t0 = Date.now()
    const r = await runProviderScoring({ dryRun: dry })
    const ms = Date.now() - t0
    console.log(`\nrun: dry=${dry} ${(ms / 1000).toFixed(1)}s  providers=${r.providers} scored=${r.scored} unknown=${r.unknown}`)
  }

  const stats = await computeProviderStats()
  const providers = await prisma.provider.findMany({ where: { removedAt: null }, select: { id: true, name: true, primaryCity: true, primaryState: true } })
  const rows = providers
    .map(p => ({ p, s: stats.get(p.id) }))
    .filter(x => x.s && x.s.sent >= MIN_SENT)
    .map(x => ({ ...x, score: scoreFromStats(x.s!)! }))
    .sort((a, b) => b.score - a.score || b.s!.sent - a.s!.sent)
  const fmt = (x: typeof rows[number], i: number) => {
    const s = x.s!
    return `${String(i + 1).padStart(3)}  ${String(x.score).padStart(3)}  ${x.p.name.trim().slice(0, 34).padEnd(34)} ${((x.p.primaryCity || '') + ', ' + (x.p.primaryState || '')).slice(0, 22).padEnd(22)} sent ${String(s.sent).padStart(3)}  claimed ${String(s.claimed).padStart(3)}  booked ${String(s.booked).padStart(2)}  median ${s.medianClaimMinutes === null ? '   -' : String(s.medianClaimMinutes).padStart(4)}m  released ${s.staleReleases}`
  }
  console.log(`\nscored providers: ${rows.length}\n\nTOP 10`)
  rows.slice(0, 10).forEach((x, i) => console.log(fmt(x, i)))
  console.log(`\nscore 0: ${rows.filter(x => x.score === 0).length}   score < 35: ${rows.filter(x => x.score < 35).length}   score >= 60: ${rows.filter(x => x.score >= 60).length}`)
  console.log('\nBOTTOM 10')
  rows.slice(-10).forEach((x, i) => console.log(fmt(x, rows.length - 10 + i)))
  const busy = rows.filter(x => x.s!.sent >= 5)
  console.log(`\nBOTTOM 10 among providers sent >= 5 (${busy.length} providers)`)
  busy.slice(-10).forEach(x => console.log(fmt(x, rows.indexOf(x))))
  console.log('\nNAMED')
  rows.forEach((x, i) => { if (/sticks r us|us mobile lab/i.test(x.p.name)) console.log(fmt(x, i)) })
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
