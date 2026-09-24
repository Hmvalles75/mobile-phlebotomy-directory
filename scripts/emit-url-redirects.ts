// Generates data/url-redirects.json, which next.config.mjs reads at build time.
//
// next.config.mjs cannot import TypeScript, so the redirect lists that derive
// from typed data live here and are emitted as JSON:
//   states  – 51 root-level state slugs (/ohio -> /us/ohio). Sources match
//             case-insensitively, so /Ohio and /KENTUCKY land on the lowercase
//             destination in one hop.
//   metros  – every metro whose canonical is its city page, per metroHref().
//             new-york-city and washington-dc are metro-only and stay put.
//
//   npx tsx scripts/emit-url-redirects.ts          # write the file
//   npx tsx scripts/emit-url-redirects.ts --check  # exit 1 if the file is stale
import * as fs from 'fs'
import { STATE_DATA } from '../data/states-full'
import { topMetroAreas } from '../data/top-metros'
import { metroHref } from '../lib/seo/metroCanonical'

const OUT = 'data/url-redirects.json'

const states = Object.keys(STATE_DATA).sort()
// topMetroAreas lists detroit and miami twice (same data both times); dedupe by slug.
const seen = new Set<string>()
const metros = topMetroAreas
  .filter(m => { if (seen.has(m.slug)) return false; seen.add(m.slug); return true })
  .filter(m => metroHref(m) !== `/us/metro/${m.slug}`)
  .map(m => ({ source: `/us/metro/${m.slug}`, destination: metroHref(m) }))
  .sort((a, b) => a.source.localeCompare(b.source))

const json = JSON.stringify({ generatedBy: 'scripts/emit-url-redirects.ts', states, metros }, null, 2) + '\n'

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8') : ''
  if (current !== json) { console.error(`${OUT} is stale; run npx tsx scripts/emit-url-redirects.ts`); process.exit(1) }
  console.log(`${OUT} is current (${states.length} states, ${metros.length} metros)`)
} else {
  fs.writeFileSync(OUT, json)
  console.log(`wrote ${OUT}: ${states.length} states, ${metros.length} metro redirects`)
  const kept = topMetroAreas.filter(m => metroHref(m) === `/us/metro/${m.slug}`).map(m => m.slug)
  console.log(`metro-only (unchanged): ${kept.join(', ')}`)
}
