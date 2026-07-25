/**
 * Read-only provider data-quality audit.
 *
 * Reports every issue it finds; changes nothing. Cleanup is a separate,
 * explicit pass (see scripts/clean-providers-audit.ts) so we never mutate
 * rows without eyeballing the list first.
 *
 *   pnpm tsx scripts/audit-providers.ts            # summary + top offenders
 *   pnpm tsx scripts/audit-providers.ts --full     # every row in every bucket
 *   pnpm tsx scripts/audit-providers.ts --json     # machine-readable dump
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { detectJunkDescription } from '../lib/detectJunkDescription'
import { normalizeCityName, citySlug } from '../lib/city-normalize'
import { stateNameToAbbr } from '../lib/utils'

const prisma = new PrismaClient()
const FULL = process.argv.includes('--full')
const JSON_OUT = process.argv.includes('--json')

type Row = {
  id: string
  name: string
  slug: string
  phone: string | null
  phonePublic: string | null
  email: string | null
  website: string | null
  description: string | null
  primaryCity: string | null
  primaryState: string | null
  primaryCitySlug: string | null
  primaryStateSlug: string | null
  status: string
  listingTier: string
  featuredTier: string | null
  isFeatured: boolean
  featured: boolean
  isFeaturedCity: boolean
  premiumPage: boolean
  eligibleForLeads: boolean
  priorityRouting: boolean
  serviceRadiusMiles: number | null
  serviceZipCodes: string | null
  zipCodes: string | null
  descriptionFlagged: boolean
  removedAt: Date | null
  doNotRelist: boolean
  source: string
  claimVerifiedAt: Date | null
  stripeCustomerId: string | null
  createdAt: Date
}

// ── helpers ──────────────────────────────────────────────────────────
const digits = (s: string | null) => (s || '').replace(/\D/g, '')

function normPhone(s: string | null): string | null {
  const d = digits(s)
  if (d.length === 11 && d.startsWith('1')) return d.slice(1)
  return d.length === 10 ? d : null
}

function phoneLooksBad(s: string | null): boolean {
  if (!s || !s.trim()) return false // missing is its own bucket
  return normPhone(s) === null
}

function emailLooksBad(s: string | null): boolean {
  if (!s || !s.trim()) return false
  return !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s.trim())
}

function websiteLooksBad(s: string | null): boolean {
  if (!s || !s.trim()) return false
  try {
    const u = new URL(s.trim())
    return !['http:', 'https:'].includes(u.protocol)
  } catch {
    return true
  }
}

const SOCIAL_HOSTS = ['facebook.com', 'instagram.com', 'linkedin.com', 'yelp.com', 'google.com', 'maps.app.goo.gl', 'twitter.com', 'x.com', 'tiktok.com']
function websiteIsSocial(s: string | null): boolean {
  if (!s || !s.trim()) return false
  try {
    const host = new URL(s.trim()).hostname.replace(/^www\./, '')
    return SOCIAL_HOSTS.some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}

/** Use the SAME detector the render path uses, so audit and UI never disagree. */
const descriptionIsJunk = (d: string | null) => detectJunkDescription(d).isJunk

/**
 * Test/demo rows only. Deliberately narrow: "Any Lab Test Now" and the dozens of
 * legitimate "Drug Testing" businesses are real listings, so a bare /\btest\b/
 * over-flags badly. Require the fake-data word to lead the name or the slug.
 */
const TEST_PATTERNS = /^(test|demo|sample|example|asdf|qwerty|dummy|placeholder|delete\s*me|do\s*not\s*use)\b/i

const STATE_ABBRS = new Set(Object.values(
  // stateNameToAbbr is name→abbr; invert-free check: an abbr is any 2-letter code it can emit
  Object.fromEntries(['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'].map((n) => [n, stateNameToAbbr(n)]))
))

/** primaryState must hold a 2-letter abbr — routing compares it to stateAbbr. */
function stateIsNotAbbr(s: string | null): boolean {
  if (!s?.trim()) return false
  return !STATE_ABBRS.has(s.trim().toUpperCase())
}

/** A stored primaryCity that is obviously not a city name (SEO junk, a ZIP, a business name). */
function cityLooksWrong(c: string | null): boolean {
  if (!c?.trim()) return false
  const t = c.trim()
  if (/^\d/.test(t)) return true                       // "98503"
  if (t.split(/\s+/).length > 4) return true           // "Drug Testing Near Katy Texas ..."
  return /\b(near|drug|testing|lab|labs|medical|phlebotomy|services|hospital|center|clinic)\b/i.test(t)
}

/**
 * Duplicate key. Strips legal suffixes but KEEPS the distinguishing words —
 * stripping "mobile/phlebotomy/services" collapses "Elite Phlebotomy" and
 * "Elite Mobile Phlebotomy Services" down to "elite" and produces false pairs.
 */
function nameKey(n: string): string {
  return n
    .toLowerCase()
    .replace(/\b(llc|l\.l\.c\.|inc|inc\.|corp|corporation|co|company)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// ── buckets ──────────────────────────────────────────────────────────
type Bucket = { key: string; label: string; why: string; rows: Row[] }

async function main() {
  const all: Row[] = (await prisma.provider.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, slug: true, phone: true, phonePublic: true, email: true, website: true,
      description: true, primaryCity: true, primaryState: true, primaryCitySlug: true,
      primaryStateSlug: true, status: true, listingTier: true, featuredTier: true,
      isFeatured: true, featured: true, isFeaturedCity: true, premiumPage: true,
      eligibleForLeads: true, priorityRouting: true, serviceRadiusMiles: true,
      serviceZipCodes: true, zipCodes: true, descriptionFlagged: true,
      removedAt: true, doNotRelist: true, source: true, claimVerifiedAt: true,
      stripeCustomerId: true, createdAt: true,
    },
  })) as unknown as Row[]

  const live = all.filter((p) => !p.removedAt)
  const removed = all.filter((p) => p.removedAt)

  const buckets: Bucket[] = []
  const add = (key: string, label: string, why: string, rows: Row[]) => {
    if (rows.length) buckets.push({ key, label, why, rows })
  }

  // ── contactability (live rows only — removed rows don't render) ─────
  add('no-contact', 'No contact method at all', 'No phone, no email, no website — cannot be reached or routed a lead. Delist candidates.',
    live.filter((p) => !p.phone?.trim() && !p.email?.trim() && !p.website?.trim()))
  add('no-phone', 'Missing phone', 'Phone is the primary conversion path on the provider page.',
    live.filter((p) => !p.phone?.trim() && (p.email?.trim() || p.website?.trim())))
  // phonePublic is what the tel: link dials, so a display number carrying an
  // extension ("(978) 922-3000 ext. 6009") is fine as long as phonePublic is clean.
  add('bad-phone', 'Malformed phone', 'Not a parseable 10-digit US number and no usable phonePublic — the tel: link is broken.',
    live.filter((p) => phoneLooksBad(p.phone) && !normPhone(p.phonePublic)))
  add('bad-email', 'Malformed email', 'Fails basic shape check — lead notifications bounce.',
    live.filter((p) => emailLooksBad(p.email)))
  add('bad-website', 'Malformed website URL', 'Not a valid http(s) URL — renders a dead link.',
    live.filter((p) => websiteLooksBad(p.website)))
  add('social-website', 'Website is a social/aggregator link', 'Facebook/Yelp/Google links are not owned sites; these are the no-website $199 pitch targets.',
    live.filter((p) => websiteIsSocial(p.website)))

  // ── content quality ────────────────────────────────────────────────
  add('junk-desc-unflagged', 'Junk description NOT flagged', 'Matches the junk heuristic but descriptionFlagged=false, so the junk renders publicly.',
    live.filter((p) => descriptionIsJunk(p.description) && !p.descriptionFlagged))
  add('clean-desc-still-flagged', 'Clean description still flagged', 'descriptionFlagged=true but text now looks fine — page shows "Contact for details." for no reason.',
    live.filter((p) => p.descriptionFlagged && p.description && !descriptionIsJunk(p.description)))
  add('no-desc', 'No description', 'Thin page — hurts the listing and the city page it sits on.',
    live.filter((p) => !p.description?.trim()))

  // ── geo / routing integrity ────────────────────────────────────────
  add('state-not-abbr', 'primaryState is not a 2-letter abbr', 'Routing compares primaryState to a state ABBR (leadNotifications.ts, coverage-map.ts). A full name never matches — these providers are invisible to state routing and internal links.',
    live.filter((p) => stateIsNotAbbr(p.primaryState)))
  add('city-looks-wrong', 'primaryCity holds non-city text', 'Scraped SEO titles/ZIPs landed in primaryCity — builds a garbage city page or none at all.',
    live.filter((p) => cityLooksWrong(p.primaryCity)))
  add('city-slug-mismatch', 'primaryCitySlug disagrees with primaryCity', 'Slug was not regenerated after the city changed — provider lands on the wrong city page.',
    live.filter((p) => {
      if (!p.primaryCity?.trim() || !p.primaryCitySlug?.trim()) return false
      if (cityLooksWrong(p.primaryCity)) return false // already reported above
      return citySlug(normalizeCityName(p.primaryCity)) !== p.primaryCitySlug
    }))
  add('no-state', 'Missing primaryState', 'Cannot appear on any state page; invisible to state-scoped routing.',
    live.filter((p) => !p.primaryState?.trim()))
  add('no-city', 'Missing primaryCity', 'Cannot appear on a city page.',
    live.filter((p) => !p.primaryCity?.trim() && p.primaryState?.trim()))
  add('city-no-slug', 'City set but no primaryCitySlug', 'City page URL cannot be built — provider silently drops off the city listing.',
    live.filter((p) => p.primaryCity?.trim() && !p.primaryCitySlug?.trim()))
  add('state-no-slug', 'State set but no primaryStateSlug', 'State page URL cannot be built.',
    live.filter((p) => p.primaryState?.trim() && !p.primaryStateSlug?.trim()))
  add('eligible-no-radius', 'Lead-eligible but no service radius', 'eligibleForLeads=true with no serviceRadiusMiles and no ZIP list — routing has no geometry to match on.',
    live.filter((p) => p.eligibleForLeads && !p.serviceRadiusMiles && !p.serviceZipCodes?.trim() && !p.zipCodes?.trim()))
  add('eligible-no-email', 'Lead-eligible but no email', 'Email is the only notification channel (SMS is dead) — this provider can never be told about a lead.',
    live.filter((p) => p.eligibleForLeads && !p.email?.trim()))

  // ── tier / billing consistency ─────────────────────────────────────
  add('priority-no-stripe', 'priorityRouting without Stripe customer', 'Wave-1 head start is reserved for paying providers; no stripeCustomerId means likely not paying.',
    live.filter((p) => p.priorityRouting && !p.stripeCustomerId))
  add('featured-flag-drift', 'Featured flags disagree', 'isFeatured / featured / listingTier / featuredTier are out of sync — the known 20+ stale legacy entries.',
    live.filter((p) => {
      const signals = [p.isFeatured, p.featured, p.listingTier === 'FEATURED' || p.listingTier === 'PREMIUM', !!p.featuredTier]
      const on = signals.filter(Boolean).length
      return on > 0 && on < signals.length
    }))
  add('premium-not-featured', 'premiumPage without a paid tier', 'Renders the $199 premium template but carries no featuredTier — confirm it is paid for.',
    live.filter((p) => p.premiumPage && !p.featuredTier))

  // ── junk rows ──────────────────────────────────────────────────────
  add('test-rows', 'Test / placeholder rows', 'Name or slug matches test/demo/placeholder patterns — should not be public.',
    live.filter((p) => TEST_PATTERNS.test(p.name) || TEST_PATTERNS.test(p.slug)))
  add('removed-still-eligible', 'Removed but still lead-eligible', 'removedAt is set but eligibleForLeads=true — dead listing can still be routed leads.',
    removed.filter((p) => p.eligibleForLeads))
  add('removed-still-featured', 'Removed but still carries featured flags', 'Cosmetic, but pollutes featured audits and admin counts.',
    removed.filter((p) => p.isFeatured || p.featured || p.isFeaturedCity || !!p.featuredTier))

  // ── duplicates (live only) ─────────────────────────────────────────
  const dupBuckets: { reason: string; rows: Row[] }[] = []
  const byPhone = new Map<string, Row[]>()
  for (const p of live) {
    const n = normPhone(p.phone)
    if (!n) continue
    byPhone.set(n, [...(byPhone.get(n) || []), p])
  }
  for (const [k, rows] of byPhone) if (rows.length > 1) dupBuckets.push({ reason: `phone ${k}`, rows })

  // Name duplicates are keyed on (normalized name + state). Without the state
  // guard, national chains with per-branch rows (Northwell, Vanderbilt) and
  // generic names produce noise that buries the real dupes.
  const byName = new Map<string, Row[]>()
  for (const p of live) {
    const k = nameKey(p.name)
    if (k.length < 8) continue
    const key = `${k}|${(p.primaryState || '').toUpperCase()}`
    byName.set(key, [...(byName.get(key) || []), p])
  }
  for (const [k, rows] of byName) {
    if (rows.length < 2) continue
    // Skip if the phone pass already grouped exactly these rows.
    if (dupBuckets.some((d) => rows.every((r) => d.rows.includes(r)))) continue
    dupBuckets.push({ reason: `name "${k}"`, rows })
  }

  // ── output ─────────────────────────────────────────────────────────
  if (JSON_OUT) {
    console.log(JSON.stringify({
      totals: { all: all.length, live: live.length, removed: removed.length },
      buckets: buckets.map((b) => ({ key: b.key, label: b.label, count: b.rows.length, rows: b.rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug })) })),
      duplicates: dupBuckets.map((d) => ({ reason: d.reason, rows: d.rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, createdAt: r.createdAt })) })),
    }, null, 2))
    await prisma.$disconnect()
    return
  }

  console.log('═'.repeat(78))
  console.log('PROVIDER AUDIT')
  console.log('═'.repeat(78))
  console.log(`Total rows: ${all.length}   Live: ${live.length}   Soft-removed: ${removed.length}`)
  console.log(`Lead-eligible: ${live.filter((p) => p.eligibleForLeads).length}   Paying-ish (featuredTier set): ${live.filter((p) => p.featuredTier).length}`)
  console.log('')

  console.log('─ SUMMARY ' + '─'.repeat(67))
  for (const b of buckets) console.log(`${String(b.rows.length).padStart(5)}  ${b.key.padEnd(26)} ${b.label}`)
  const dupRows = new Set(dupBuckets.flatMap((d) => d.rows.map((r) => r.id)))
  console.log(`${String(dupBuckets.length).padStart(5)}  ${'duplicate-groups'.padEnd(26)} Duplicate groups (${dupRows.size} rows involved)`)
  console.log('')

  const LIMIT = FULL ? Infinity : 12
  for (const b of buckets) {
    console.log('─'.repeat(78))
    console.log(`${b.label} — ${b.rows.length}`)
    console.log(`  ${b.why}`)
    for (const p of b.rows.slice(0, LIMIT)) {
      const geo = [p.primaryCity, p.primaryState].filter(Boolean).join(', ') || '—'
      console.log(`    ${p.name.slice(0, 44).padEnd(44)} ${geo.slice(0, 22).padEnd(22)} /${p.slug}`)
    }
    if (b.rows.length > LIMIT) console.log(`    … ${b.rows.length - LIMIT} more (--full)`)
  }

  if (dupBuckets.length) {
    console.log('─'.repeat(78))
    console.log(`Duplicate groups — ${dupBuckets.length}`)
    console.log('  Same phone or same normalized name. Keep the richest/oldest, soft-remove the rest.')
    for (const d of dupBuckets.slice(0, FULL ? Infinity : 15)) {
      console.log(`  ▸ ${d.reason}`)
      for (const p of d.rows) {
        const filled = [p.phone && 'ph', p.email && 'em', p.website && 'web', p.description && 'desc'].filter(Boolean).join(',')
        console.log(`      ${p.name.slice(0, 40).padEnd(40)} ${p.createdAt.toISOString().slice(0, 10)}  [${filled}]  ${p.eligibleForLeads ? 'ELIGIBLE' : ''} /${p.slug}`)
      }
    }
    if (dupBuckets.length > 15 && !FULL) console.log(`  … ${dupBuckets.length - 15} more groups (--full)`)
  }

  console.log('═'.repeat(78))
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
