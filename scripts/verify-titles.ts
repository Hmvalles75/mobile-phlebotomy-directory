// Title / description / H1 check on a handful of pages, with the rules from
// site batch 4 (2026-09-25): exactly one "| MobilePhlebotomy.org" suffix, an
// H1 in the server HTML, and no "0 providers" text on a page that lists
// providers.
//   npx tsx scripts/verify-titles.ts                       # production
//   BASE=http://localhost:3100 npx tsx scripts/verify-titles.ts
const BASE = (process.env.BASE || 'https://www.mobilephlebotomy.org').replace(/\/$/, '')
const PATHS = process.argv.slice(2).length ? process.argv.slice(2) : [
  '/us/california', '/us/wyoming', '/us/ohio/columbus', '/us/washington/seattle', '/us/alaska/anchorage',
  '/clinical-trials-mobile-phlebotomy', '/terms', '/metros', '/search', '/for-networks',
]
const SUFFIX = '| MobilePhlebotomy.org'

function text(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&apos;/g, "'").replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim()
}

async function main() {
  let fails = 0
  for (const p of PATHS) {
    const res = await fetch(BASE + p, { headers: { 'User-Agent': 'verify-titles/1' } })
    const html = await res.text()
    const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    const title = text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || ''
    const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => text(m[1]))
    const providerLinks = new Set([...body.matchAll(/href="(\/provider\/[^"?#]+)"/g)].map(m => m[1])).size
    const zero = /\b0\s+providers?\b/i.test(text(body))
    const problems: string[] = []
    if (res.status !== 200) problems.push(`status ${res.status}`)
    if (title.split(SUFFIX).length - 1 !== 1) problems.push(`suffix x${title.split(SUFFIX).length - 1}`)
    if (h1s.length === 0) problems.push('no H1')
    if (h1s.length > 1) problems.push(`${h1s.length} H1s`)
    if (providerLinks > 0 && zero) problems.push('"0 providers" text with providers listed')
    if (!desc) problems.push('no description')
    // A count in the title must be the count the page body states.
    const titleN = title.match(/\| (\d+) (?:Local )?At-Home/)?.[1]
    const bodyN = text(body).match(/(\d+)\s+(?:providers? available|Providers? (?:Available|Found|Serving))/i)?.[1]
    if (titleN && bodyN && titleN !== bodyN) problems.push(`title says ${titleN} providers, page says ${bodyN}`)
    if (problems.length) fails++
    console.log(`${problems.length ? 'FAIL' : 'OK  '} ${p}\n     title: ${title}\n     desc:  ${desc.slice(0, 150)}${desc.length > 150 ? '…' : ''}\n     h1:    ${h1s.join(' | ') || '(none)'}\n     providers linked: ${providerLinks}${problems.length ? '\n     !! ' + problems.join('; ') : ''}`)
  }
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL OK'}`)
  process.exit(fails ? 1 : 0)
}
main()
