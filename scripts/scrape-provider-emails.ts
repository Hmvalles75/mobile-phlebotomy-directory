import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const prisma = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry-run')
const STATE_FILTER = process.argv.find(a => a.startsWith('--state='))?.split('=')[1]
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'scraped-emails.json')

// Skip emails that are clearly not the business email
const SKIP_PATTERNS = [
  /privacy/i, /support@(godaddy|wix|squarespace|wordpress|gmail)/i,
  /noreply/i, /no-reply/i, /donotreply/i,
  /webmaster/i, /postmaster/i, /abuse@/i, /domain/i,
  /sentry/i, /example\.com/i,
]

// Common contact page paths
const CONTACT_PATHS = ['/contact', '/contact-us', '/about', '/about-us', '']

// Email regex (matches most valid email patterns)
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

interface Result {
  providerId: string
  providerName: string
  website: string
  state: string | null
  emails: string[]
  primaryEmail: string | null
}

async function fetchPage(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MobilePhlebotomyBot/1.0)' },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractEmails(html: string, websiteDomain: string | null): string[] {
  const matches = html.match(EMAIL_REGEX) || []
  const cleaned = matches
    .map(e => e.toLowerCase())
    .filter(e => !SKIP_PATTERNS.some(p => p.test(e)))
    .filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.gif')) // image filenames
    .filter(e => e.length < 80) // sanity check

  const unique = [...new Set(cleaned)]

  // Prefer emails matching the website domain
  if (websiteDomain) {
    unique.sort((a, b) => {
      const aMatch = a.endsWith('@' + websiteDomain) || a.endsWith('.' + websiteDomain)
      const bMatch = b.endsWith('@' + websiteDomain) || b.endsWith('.' + websiteDomain)
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return 0
    })
  }

  return unique
}

function getDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function scrapeProvider(provider: { id: string, name: string, website: string | null, primaryState: string | null }): Promise<Result> {
  const result: Result = {
    providerId: provider.id,
    providerName: provider.name,
    website: provider.website || '',
    state: provider.primaryState,
    emails: [],
    primaryEmail: null,
  }

  if (!provider.website) return result

  const domain = getDomain(provider.website)
  const baseUrl = provider.website.startsWith('http') ? provider.website : 'https://' + provider.website
  const baseUrlClean = baseUrl.replace(/\/+$/, '').split('?')[0]

  const allEmails = new Set<string>()

  for (const subPath of CONTACT_PATHS) {
    const url = subPath ? baseUrlClean + subPath : baseUrlClean
    const html = await fetchPage(url)
    if (html) {
      const emails = extractEmails(html, domain)
      emails.forEach(e => allEmails.add(e))
      // Stop early if we found a domain-matching email
      if (domain && emails.some(e => e.endsWith('@' + domain))) break
    }
  }

  result.emails = [...allEmails]

  // Only accept emails matching the website domain — anything else is likely
  // a third-party widget, affiliate link, or scraped boilerplate.
  if (domain) {
    const domainMatched = result.emails.filter(e => {
      const emailDomain = e.split('@')[1]
      return emailDomain === domain || emailDomain.endsWith('.' + domain)
    })
    result.primaryEmail = domainMatched[0] || null
  } else {
    result.primaryEmail = null
  }

  return result
}

async function main() {
  const where: any = {
    eligibleForLeads: false,
    website: { not: null },
    OR: [{ email: null }, { email: 'filler@godaddy.com' }],
  }
  if (STATE_FILTER) where.primaryState = STATE_FILTER

  const providers = await prisma.provider.findMany({
    where,
    select: { id: true, name: true, website: true, primaryState: true },
    take: LIMIT > 0 ? LIMIT : undefined,
  })

  console.log('=== EMAIL SCRAPER ===')
  console.log('Mode:', DRY_RUN ? 'DRY RUN' : 'LIVE (will update DB)')
  console.log('State filter:', STATE_FILTER || 'all')
  console.log('Providers to scrape:', providers.length)
  console.log('')

  const results: Result[] = []
  let foundCount = 0
  let i = 0

  for (const p of providers) {
    i++
    process.stdout.write(`[${i}/${providers.length}] ${p.name.substring(0, 50).padEnd(52)} `)
    const result = await scrapeProvider(p)
    results.push(result)

    if (result.primaryEmail) {
      console.log('✅ ' + result.primaryEmail + (result.emails.length > 1 ? ' (+' + (result.emails.length - 1) + ')' : ''))
      foundCount++

      if (!DRY_RUN) {
        await prisma.provider.update({
          where: { id: p.id },
          data: { email: result.primaryEmail }
        })
      }
    } else {
      console.log('❌ no email found')
    }
  }

  // Save full results
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2))

  console.log('\n=== DONE ===')
  console.log('Scraped: ' + providers.length)
  console.log('Found emails: ' + foundCount)
  console.log('Hit rate: ' + ((foundCount / providers.length) * 100).toFixed(1) + '%')
  console.log('Results saved to: ' + OUTPUT_PATH)

  if (DRY_RUN) {
    console.log('\nDRY RUN — no database updates made. Run without --dry-run to save emails.')
  }

  await prisma.$disconnect()
}

main()
