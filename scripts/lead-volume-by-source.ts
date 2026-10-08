/**
 * Read-only: where the lead volume came from, July through October 2026.
 * Monthly counts by attribution source, by page group, and the top landing
 * pages, so a drop can be traced to a channel or a set of pages.
 *   npx tsx scripts/lead-volume-by-source.ts
 */
import { prisma } from '../lib/prisma'
const MONTHS = ['2026-07', '2026-08', '2026-09', '2026-10']
const group = (p: string | null) => {
  if (!p) return '(none)'
  const path = p.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (/^\/us\/[^/]+\/[^/]+/.test(path)) return 'city page'
  if (/^\/us\/[^/]+$/.test(path)) return 'state page'
  if (/^\/provider\//.test(path)) return 'provider page'
  if (/^\/request-blood-draw/.test(path)) return 'request form'
  if (/^\/(mobile-phlebotomy-|clinical|corporate|event|at-home|blood-draw|how-|what-|faq|insurance)/.test(path)) return 'guide/service page'
  return 'other: ' + path.slice(0, 30)
}
async function main() {
  const leads = await prisma.lead.findMany({ where: { createdAt: { gte: new Date('2026-07-01') } }, select: { createdAt: true, attributionSource: true, landingPage: true, notes: true, isHighValue: true } })
  const mon = (d: Date) => d.toISOString().slice(0, 7)
  const days = (m: string) => (m === '2026-10' ? Math.max(1, Math.floor((Date.now() - new Date('2026-10-01').getTime()) / 86400e3)) : new Date(+m.slice(0, 4), +m.slice(5), 0).getDate())
  function table(title: string, key: (l: typeof leads[number]) => string, top = 12) {
    const m = new Map<string, Record<string, number>>()
    for (const l of leads) { const k = key(l); const r = m.get(k) || {}; r[mon(l.createdAt)] = (r[mon(l.createdAt)] || 0) + 1; m.set(k, r) }
    const rows = [...m.entries()].sort((a, b) => MONTHS.reduce((s, x) => s + (b[1][x] || 0), 0) - MONTHS.reduce((s, x) => s + (a[1][x] || 0), 0)).slice(0, top)
    console.log(`\n${title}\n  ${''.padEnd(34)}${MONTHS.map(x => x.padStart(9)).join('')}   Oct/day vs Jul/day`)
    for (const [k, r] of rows) {
      const jd = (r['2026-07'] || 0) / days('2026-07'), od = (r['2026-10'] || 0) / days('2026-10')
      console.log(`  ${k.slice(0, 34).padEnd(34)}${MONTHS.map(x => String(r[x] || 0).padStart(9)).join('')}   ${od.toFixed(2)} vs ${jd.toFixed(2)}`)
    }
  }
  console.log('leads per month: ' + MONTHS.map(x => `${x} ${leads.filter(l => mon(l.createdAt) === x).length} (${(leads.filter(l => mon(l.createdAt) === x).length / days(x)).toFixed(1)}/day)`).join('  '))
  table('BY SOURCE (first touch)', l => (l.attributionSource || '(unknown)').toLowerCase())
  table('BY PAGE GROUP', l => group(l.landingPage))
  table('TOP LANDING PAGES', l => (l.landingPage || '(none)').split('?')[0], 20)
  // July's spike: which week and pages
  const wk = new Map<string, number>(); for (const l of leads.filter(l => mon(l.createdAt) === '2026-07')) { const d = new Date(l.createdAt); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); const k = d.toISOString().slice(0, 10); wk.set(k, (wk.get(k) || 0) + 1) }
  console.log('\nJuly by week (week starting): ' + [...wk.entries()].sort().map(([k, v]) => `${k} ${v}`).join('  '))
}
main().finally(() => prisma.$disconnect())
