import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { submitToIndexNow } from '../lib/indexNow'

/**
 * Push URLs to Bing via IndexNow.
 *
 *   npx tsx scripts/indexnow-submit.ts --sitemap
 *   npx tsx scripts/indexnow-submit.ts --priority
 *   npx tsx scripts/indexnow-submit.ts /clinical-trials-mobile-phlebotomy /request-coverage
 *
 * --sitemap  pulls every URL from the live sitemap. Use after a bulk change
 *            (city consolidation, a batch of new providers) — not routinely,
 *            since resubmitting 1000 unchanged URLs teaches Bing nothing.
 * --priority submits just the institutional funnel, which is what actually
 *            converts: both closed deals came through /request-coverage.
 *
 * The key file must be live in production before this works — IndexNow
 * validates ownership by fetching /{key}.txt. Run this after deploying, not
 * before, or every submission comes back 403.
 */

const PRIORITY_PAGES = [
  '/request-coverage',
  '/clinical-trials-mobile-phlebotomy',
  '/corporate-phlebotomy',
  '/for-networks',
  '/mobile-phlebotomy-partnership',
  '/mobile-phlebotomy-cost',
  '/',
]

async function urlsFromSitemap(): Promise<string[]> {
  const res = await fetch('https://www.mobilephlebotomy.org/sitemap.xml')
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`)
  const xml = await res.text()
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1])
}

async function main() {
  const args = process.argv.slice(2)
  let urls: string[]

  if (args.includes('--sitemap')) {
    urls = await urlsFromSitemap()
    console.log(`Pulled ${urls.length} URLs from the live sitemap.`)
  } else if (args.includes('--priority') || args.length === 0) {
    urls = PRIORITY_PAGES
    console.log(`Submitting the ${urls.length} institutional funnel pages.`)
  } else {
    urls = args
    console.log(`Submitting ${urls.length} URL(s) from the command line.`)
  }

  urls.slice(0, 12).forEach(u => console.log(`   ${u}`))
  if (urls.length > 12) console.log(`   … and ${urls.length - 12} more`)

  const result = await submitToIndexNow(urls)
  console.log()
  if (result.ok) {
    console.log(`✅ Accepted ${result.submitted} URL(s)${result.status ? ` (HTTP ${result.status})` : ''}`)
    console.log('   Bing queues these for crawl — it is not instant indexing, but it is minutes/hours rather than weeks.')
  } else {
    console.log(`❌ Failed${result.status ? ` (HTTP ${result.status})` : ''}: ${result.error ?? 'unknown'}`)
    if (result.status === 403) {
      console.log('   403 means Bing could not verify the key file. Confirm this returns the key:')
      console.log('   https://www.mobilephlebotomy.org/4d7e22371b0a6f6abfca9772df746c63.txt')
      console.log('   If it 404s, the deploy carrying public/<key>.txt has not landed yet.')
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
