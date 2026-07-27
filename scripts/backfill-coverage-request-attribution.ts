/**
 * One-off backfill: derive `attributionSource` for CoverageRequest rows that
 * predate the column (added 2026-07-25).
 *
 * Only rows with a stored referrer or utm_source can be resolved. Rows from the
 * legacy /corporate-phlebotomy form never sent attribution at all, so they stay
 * null — null means "we don't know", NOT "direct". Don't guess on those; a
 * fake 'direct' would poison the channel mix.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mirrors normalizeSource() in lib/attribution.ts — kept local because that
// module is client-side ('window' guards) and this is a node script.
function normalizeSource(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes('facebook') || s.includes('fb.com')) return 'facebook'
  if (s.includes('instagram')) return 'instagram'
  if (s.includes('linkedin') || s.includes('lnkd.in')) return 'linkedin'
  if (s.includes('google')) return 'google'
  if (s.includes('bing')) return 'bing'
  if (s.includes('duckduckgo')) return 'duckduckgo'
  if (s.includes('reddit')) return 'reddit'
  if (s.includes('thedrawreport') || s.includes('beehiiv')) return 'newsletter'
  if (s.includes('mobilephlebotomy')) return 'internal'
  return s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').split('.').slice(-2, -1)[0] || null
}

async function main() {
  const dryRun = !process.argv.includes('--commit')
  const rows = await prisma.coverageRequest.findMany({
    where: { attributionSource: null },
    select: { id: true, organizationName: true, referrer: true, utmSource: true, createdAt: true },
  })

  console.log(`${rows.length} rows with no attributionSource${dryRun ? '  [DRY RUN — pass --commit to write]' : ''}\n`)

  let resolved = 0
  for (const r of rows) {
    const source = normalizeSource(r.utmSource) ?? normalizeSource(r.referrer)
    const label = `${r.createdAt.toISOString().slice(0, 10)}  ${(r.organizationName || '').slice(0, 34).padEnd(34)}`
    if (!source) {
      console.log(`${label} -> (unresolvable, leaving null)`)
      continue
    }
    console.log(`${label} -> ${source}`)
    resolved++
    if (!dryRun) {
      await prisma.coverageRequest.update({ where: { id: r.id }, data: { attributionSource: source } })
    }
  }

  console.log(`\n${resolved} resolvable, ${rows.length - resolved} left null (unknown channel).`)

  // --- intakeForm -------------------------------------------------------
  // Only two forms existed before 2026-07-25. CoverageRequestForm stored its
  // own path as landingPage ('/request-coverage'); CorporateQuoteForm sent no
  // attribution at all. So a null landingPage on an old row means the legacy
  // corporate form. This inference is only valid for rows predating the
  // clinical-research form — new rows tag themselves.
  const untagged = await prisma.coverageRequest.findMany({
    where: { intakeForm: null },
    select: { id: true, organizationName: true, landingPage: true, createdAt: true },
  })

  console.log(`\n${untagged.length} rows with no intakeForm`)
  const counts: Record<string, number> = {}
  for (const r of untagged) {
    const form = r.landingPage === '/request-coverage' ? 'coverage' : 'corporate'
    counts[form] = (counts[form] || 0) + 1
    console.log(`  ${r.createdAt.toISOString().slice(0, 10)}  ${(r.organizationName || '').slice(0, 34).padEnd(34)} -> ${form}`)
    if (!dryRun) {
      await prisma.coverageRequest.update({ where: { id: r.id }, data: { intakeForm: form } })
    }
  }
  console.log(`\nintakeForm:`, counts)
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
