// Follows each URL by hand (no auto-redirect) and prints status, final URL and
// hop count. Used to prove the URL consolidation (2026-09-24): every page URL
// should reach a lowercase /us/... or /provider/... URL in ONE hop and return
// 200; assets must still load; canonical provider URLs must not redirect.
//
//   npx tsx scripts/verify-redirects.ts                       # against production
//   BASE=http://localhost:3100 npx tsx scripts/verify-redirects.ts
//   npx tsx scripts/verify-redirects.ts /some/path /other     # custom list
const BASE = (process.env.BASE || 'https://www.mobilephlebotomy.org').replace(/\/$/, '')

const DEFAULT_PATHS = [
  '/kentucky',
  '/Ohio',
  '/washington',
  '/us/metro/houston',
  '/us/metro/houston-metro',
  '/columbus-oh/mobile-phlebotomy',
  '/US/ohio',
  '/us/Florida/Miami',
  '/PROVIDER/gentle-trace-mobile',
  '/provider/tru-blu-diagnostic-lab',
  '/us/oh/columbus',
  '/us/ohio',
  '/images/Sheppard-Secured-Services-logo.jpeg',   // uppercase asset name: must NOT be lowercased
  // extra coverage
  '/us/OH/Columbus',
  '/us/metro/new-york-metro',
  '/us/metro/new-york-city',
  '/lowell-ma/blood-draw-at-home',
  '/us/florida/miami?ref=test',
  // batch 2
  '/us/north-carolina/greenville',    // newly mapped city: 200
  '/us/florida/not-a-real-city',      // unmapped city: 308 to the state page
  '/us/alaska/anchorage',             // noProviders city: 200 with noindex
  '/us/notastate/miami',              // unknown state: 404
  // batch 3
  '/us',                              // state index: 200 (was a 404 linked from every breadcrumb)
  '/providers/claim?id=cmit1gqec007mg0m0si1rudp6',   // legacy claim: 1 hop to /add-provider
  '/los-angeles/request?providerId=cmlqtfy070000l404n15zf5c3',   // lead form: 200 + noindex
  '/provider/travalab-32',            // old numbered slug: 1 hop to clean twin
  '/us/nj/maplewood',                 // abbr + unmapped city: ONE hop to the state
  '/provider/gentle-trace-mobile',    // JSON-LD @id must be the slug URL, never the cuid
]

// Per-path expectations that override the generic judge.
const EXPECT: Record<string, { status: number; hops?: number; final?: string; noindex?: boolean; jsonLdId?: string }> = {
  '/us/north-carolina/greenville': { status: 200, hops: 0 },
  '/us/florida/not-a-real-city': { status: 200, hops: 1, final: '/us/florida' },
  '/us/alaska/anchorage': { status: 200, hops: 0, noindex: true },
  '/us/notastate/miami': { status: 404, hops: 0 },
  '/us': { status: 200, hops: 0 },
  '/providers/claim?id=cmit1gqec007mg0m0si1rudp6': { status: 200, hops: 1, final: '/add-provider' },
  '/los-angeles/request?providerId=cmlqtfy070000l404n15zf5c3': { status: 200, hops: 0, noindex: true },
  '/provider/travalab-32': { status: 200, hops: 1, final: '/provider/travalab' },
  '/us/nj/maplewood': { status: 200, hops: 1, final: '/us/new-jersey' },
  '/provider/gentle-trace-mobile': { status: 200, hops: 0, jsonLdId: '/provider/gentle-trace-mobile#' },   // premium template
  '/provider/tru-blu-diagnostic-lab': { status: 200, hops: 0, jsonLdId: '/provider/tru-blu-diagnostic-lab#' },   // generic template
}

const MAX_HOPS = 5

async function follow(path: string) {
  let url = BASE + path
  const hops: string[] = []
  let status = 0
  for (let i = 0; i <= MAX_HOPS; i++) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'verify-redirects/1' } })
    status = res.status
    const loc = res.headers.get('location')
    if (status >= 300 && status < 400 && loc) {
      hops.push(`${status}`)
      url = new URL(loc, url).toString()
      continue
    }
    const e = EXPECT[path]
    const body = status === 200 && e && (e.noindex !== undefined || e.jsonLdId) ? await res.text() : ''
    // @id values are absolute against SITE_URL, which differs from BASE on a local run.
    const ids = [...body.matchAll(/"@id"\s*:\s*"([^"]+)"/g)].map(m => m[1].replace(/^https?:\/\/[^/]+/, ''))
    return { path, status, final: url.replace(BASE, ''), hops, noindex: /<meta name="robots" content="[^"]*noindex/i.test(body), ids }
  }
  return { path, status, final: url.replace(BASE, ''), hops, noindex: false, ids: [] as string[] }
}

function judge(r: { path: string; status: number; final: string; hops: string[]; noindex: boolean; ids: string[] }): string {
  const e = EXPECT[r.path]
  if (e) {
    if (r.status !== e.status) return `FAIL status ${r.status}, expected ${e.status}`
    if (e.hops !== undefined && r.hops.length !== e.hops) return `FAIL ${r.hops.length} hops, expected ${e.hops}`
    if (e.final && r.final.split('?')[0] !== e.final) return `FAIL final ${r.final}, expected ${e.final}`
    if (e.noindex && !r.noindex) return 'FAIL no noindex meta'
    if (e.jsonLdId) {
      if (!r.ids.some(i => i.startsWith(e.jsonLdId!))) return `FAIL @id ${e.jsonLdId}… not found (saw ${r.ids.slice(0, 3).join(', ') || 'none'})`
      if (r.ids.some(i => /\/provider\/c[a-z0-9]{24}$/.test(i))) return 'FAIL a cuid @id is still emitted'
      return `OK @id = ${r.ids.find(i => i.startsWith(e.jsonLdId!))}`
    }
    return `OK ${e.status}${e.noindex ? ' noindex' : ''}${e.hops ? ` ${e.hops} hop -> ${e.final}` : ''}`
  }
  const isAsset = /\.[a-z0-9]{1,8}$/i.test(r.path.split('?')[0])
  if (isAsset) return r.status === 200 && r.hops.length === 0 ? 'OK asset served, no redirect' : 'FAIL asset'
  if (r.path.startsWith('/provider/') && r.path === r.path.toLowerCase()) {
    return r.status === 200 && r.hops.length === 0 ? 'OK canonical, no redirect' : 'FAIL canonical provider URL redirected or not 200'
  }
  const finalPath = r.final.split('?')[0]
  const lower = finalPath === finalPath.toLowerCase()
  const scheme = /^\/us\/[a-z-]+(\/[a-z0-9-]+)?$/.test(finalPath) || /^\/us\/metro\/[a-z-]+$/.test(finalPath) || /^\/provider\/[a-z0-9-]+$/.test(finalPath)
  if (r.status !== 200) return `FAIL status ${r.status}`
  if (!lower) return 'FAIL final URL not lowercase'
  if (!scheme) return 'FAIL final URL not on the canonical scheme'
  if (r.hops.length > 1) return `FAIL ${r.hops.length} hops`
  return r.hops.length === 0 ? 'OK already canonical' : 'OK 1 hop'
}

async function main() {
  const paths = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PATHS
  console.log(`base: ${BASE}\n`)
  console.log('path'.padEnd(44), 'status', 'hops', ' final'.padEnd(40), 'verdict')
  let fails = 0
  for (const p of paths) {
    const r = await follow(p)
    const v = judge(r)
    if (v.startsWith('FAIL')) fails++
    console.log(p.padEnd(44), String(r.status).padEnd(6), `${r.hops.length}${r.hops.length ? ' (' + r.hops.join('>') + ')' : ''}`.padEnd(9), r.final.padEnd(40), v)
  }
  console.log(`\n${fails === 0 ? 'ALL OK' : fails + ' FAILED'}`)
  process.exit(fails ? 1 : 0)
}
main()
