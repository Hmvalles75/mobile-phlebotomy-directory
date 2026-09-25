// Read-only. Recruiting list: every state and city page with the number of
// active providers it lists (the same count the page title now uses) and, when
// a Search Console "Pages" export is available, that page's impressions.
// Sorted by impressions / providers, descending (zero-provider pages first
// when they have impressions).
//
//   npx tsx scripts/recruiting-list.ts                       # looks in docs/findings/gsc/*.csv
//   npx tsx scripts/recruiting-list.ts --gsc=path/to/Pages.csv
// Output: docs/findings/recruiting-pages-<date>.csv
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import * as path from 'path'
import { STATE_DATA } from '../data/states-full'
import { CITY_MAPPING } from '../data/cities-full'
import { getAllProviders } from '../lib/providers-db'
// lib/providers-state and lib/providers-city import next/cache, which refuses to load outside
// the Next runtime; use the same underlying pieces directly.
import { normalizeState } from '../lib/location-utils'
import { bucketProvidersForCity } from '../lib/cityGeography'

const arg = process.argv.find(a => a.startsWith('--gsc='))?.slice(6)

function loadImpressions(): { source: string; map: Map<string, number> } | null {
  let file = arg
  if (!file) {
    const dir = 'docs/findings/gsc'
    if (fs.existsSync(dir)) {
      const c = fs.readdirSync(dir).filter(f => /\.csv$/i.test(f) && /page/i.test(f))
      if (c.length) file = path.join(dir, c.sort().reverse()[0])
    }
  }
  if (!file || !fs.existsSync(file)) return null
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter(Boolean)
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  const ui = header.findIndex(h => h === 'top pages' || h === 'page' || h === 'url'), ii = header.findIndex(h => h.startsWith('impressions'))
  if (ui < 0 || ii < 0) return null
  const map = new Map<string, number>()
  for (const l of lines.slice(1)) {
    const cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')) || []
    const u = (cells[ui] || '').replace(/^https?:\/\/[^/]+/, '').split('?')[0].replace(/\/$/, '') || '/'
    const n = parseInt((cells[ii] || '0').replace(/[^0-9]/g, ''), 10) || 0
    map.set(u, (map.get(u) || 0) + n)
  }
  return { source: file, map }
}

async function main() {
  const gsc = loadImpressions()
  const all = await getAllProviders()
  const rows: { url: string; type: string; state: string; city: string; providers: number; impressions: number | '' }[] = []
  for (const [slug, info] of Object.entries(STATE_DATA)) {
    rows.push({ url: `/us/${slug}`, type: 'state', state: info.abbr, city: '', providers: all.filter(p => (p.coverage?.states && p.coverage.states.includes(normalizeState(info.abbr) || '')) || p.state === normalizeState(info.abbr)).length, impressions: '' })
  }
  for (const c of Object.values(CITY_MAPPING)) {
    const g = bucketProvidersForCity(all, c.name, c.state)
    rows.push({ url: `/us/${c.stateSlug}/${c.citySlug}`, type: c.noProviders ? 'city (noindex)' : 'city', state: c.state, city: c.name, providers: g.local.length + g.regional.length, impressions: '' })
  }
  if (gsc) for (const r of rows) r.impressions = gsc.map.get(r.url) ?? 0
  const ratio = (r: typeof rows[number]) => (typeof r.impressions === 'number' ? r.impressions / Math.max(r.providers, 0.5) : 0)
  rows.sort((a, b) => ratio(b) - ratio(a) || (b.impressions as number || 0) - (a.impressions as number || 0) || a.providers - b.providers)
  const out = `docs/findings/recruiting-pages-${new Date().toISOString().slice(0, 10)}.csv`
  const csv = ['url,type,state,city,active_providers,gsc_impressions,impressions_per_provider', ...rows.map(r => `${r.url},${r.type},${r.state},"${r.city}",${r.providers},${r.impressions},${typeof r.impressions === 'number' ? ratio(r).toFixed(1) : ''}`)].join('\n') + '\n'
  fs.writeFileSync(out, csv)
  console.log(`${rows.length} pages -> ${out}`)
  console.log(gsc ? `impressions from ${gsc.source} (${gsc.map.size} URLs)` : 'no GSC Pages export found: impressions column left blank. Drop the export in docs/findings/gsc/ (filename containing "page") or pass --gsc=path and re-run.')
  console.log('zero-provider indexable city pages:', rows.filter(r => r.type === 'city' && r.providers === 0).length, '| states with <3 providers:', rows.filter(r => r.type === 'state' && r.providers < 3).map(r => r.state).join(' '))
}
main().catch(e => { console.error(e); process.exit(1) })
