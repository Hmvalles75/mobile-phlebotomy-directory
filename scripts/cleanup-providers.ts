/**
 * Provider cleanup pass — the write half of scripts/audit-providers.ts.
 *
 * DRY-RUN BY DEFAULT. Nothing is written without --apply.
 *
 *   pnpm tsx scripts/cleanup-providers.ts                    # show every proposed change
 *   pnpm tsx scripts/cleanup-providers.ts --apply            # write all steps
 *   pnpm tsx scripts/cleanup-providers.ts --apply --only=geo # write one step group
 *
 * Only mechanical repairs live here — derive a slug, normalize a stored value,
 * null a field whose content is unusable. Anything needing a judgment call
 * (which duplicate to keep, whether a provider should stay lead-eligible) stays
 * in the audit report for a human. Soft-removal follows the house pattern:
 * removedAt / removedReason / doNotRelist, never a hard delete.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import zipcodes from 'zipcodes'
import { detectJunkDescription } from '../lib/detectJunkDescription'
import { normalizeCityName, citySlug } from '../lib/city-normalize'
import { stateNameToAbbr } from '../lib/utils'
import { CITY_MAPPING } from '../data/cities-full'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico',
}
const stateSlugOf = (abbr: string) => STATE_NAMES[abbr]?.toLowerCase().replace(/\s+/g, '-') ?? null

// ── change collection ────────────────────────────────────────────────
type Change = { step: string; id: string; name: string; field: string; from: unknown; to: unknown }
const changes: Change[] = []
const patches = new Map<string, Record<string, unknown>>()

function set(step: string, id: string, name: string, field: string, from: unknown, to: unknown) {
  if (from === to) return
  changes.push({ step, id, name, field, from, to })
  patches.set(id, { ...(patches.get(id) || {}), [field]: to })
}

const stepEnabled = (s: string) => !ONLY || ONLY === s

// ── one-off repairs keyed by slug ────────────────────────────────────
// Each of these was eyeballed individually in the audit; the value is either
// recoverable from another column on the same row or unusable and nulled.
const CONTACT_FIXES: Record<string, Record<string, string | null>> = {
  // 9-digit phone, but phonePublic already holds the correct 10-digit number.
  'steves-gentle-touch-phlebotomy-and-specimen-collection-llc': { phone: '9414152717' },
  // Display number carries an extension, which breaks tel:. Keep the human-readable
  // phone, give the dialer a clean number.
  'laboratory-beverly-hospital': { phonePublic: '9789223000' },
  // "724" — an area code with no number. Unusable; the row still has an email.
  'corecomfort-mobile-lab-llc-': { phone: null, phonePublic: null },
  // 9 digits, no way to infer the missing one.
  'mobile-phlebotomy-professionals-llc': { phone: null, phonePublic: null },
  // email was the literal string "AMT".
  'pfm-mobile-phlebotomy-and-wellness-llc': { email: null },
  // email held a scraped image path + page title.
  'vital-hearts-llc': { email: null },
  // Domain was misspelled "oltimal" — a dead link on a partner's listing.
  // Correct spelling confirmed by the row's own contact email
  // (admin@optimalparamedicalexams.com).
  'optimal-paramedical-exams-llc': { website: 'https://www.optimalparamedicalexams.com' },
}

/** Repair a URL that is a real address wearing the wrong protocol. */
function repairUrl(raw: string): string | null {
  let s = raw.trim()
  if (!s) return null
  s = s.replace(/^(https?):\s*\/\//i, '$1://')   // "https: //x" / "https:  //x"
  s = s.replace(/^(https?):\s+/i, '$1://')        // "https: labservicesinc.com"
  s = s.replace(/^www:\/\//i, 'https://')         // "www://x.net"
  s = s.replace(/\s+/g, '')                       // "https:// twentyfour-..."
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    const u = new URL(s)
    // Reject anything that still isn't a plausible hostname (e.g. a bare email).
    if (!u.hostname.includes('.') || u.hostname.includes('@')) return null
    return u.toString()
  } catch {
    return null
  }
}

/** Internal test listings — excluded from every repair step, then soft-removed. */
const isTestRow = (name: string) => /^(test|demo|sample|placeholder)\b/i.test(name)

async function main() {
  const all = await prisma.provider.findMany({
    where: { removedAt: null },
    select: {
      id: true, name: true, slug: true, phone: true, phonePublic: true, email: true,
      website: true, description: true, descriptionFlagged: true, primaryCity: true,
      primaryCitySlug: true, primaryState: true, primaryStateName: true,
      primaryStateSlug: true, zipCodes: true, serviceZipCodes: true,
    },
    orderBy: { name: 'asc' },
  })
  // Don't spend repair steps on rows that are about to be removed.
  const live = all.filter((p) => !isTestRow(p.name))

  // ── STEP geo-state: primaryState must be a 2-letter abbr ───────────
  // Routing compares primaryState directly to a state abbreviation
  // (lib/leadNotifications.ts, lib/coverage-map.ts). A row holding
  // "Mississippi" matches nothing and is invisible to state routing.
  if (stepEnabled('geo')) {
    for (const p of live) {
      const s = p.primaryState?.trim()
      if (!s) continue
      if (STATE_NAMES[s.toUpperCase()]) {
        if (s !== s.toUpperCase()) set('geo-state', p.id, p.name, 'primaryState', s, s.toUpperCase())
        continue
      }
      const abbr = stateNameToAbbr(s)
      if (abbr && STATE_NAMES[abbr]) set('geo-state', p.id, p.name, 'primaryState', s, abbr)
    }
  }

  // ── STEP geo-zip: recover city/state from a ZIP already on the row ──
  if (stepEnabled('geo')) {
    for (const p of live) {
      const cityIsZip = p.primaryCity && /^\d{5}/.test(p.primaryCity.trim())
      if (p.primaryCity && !cityIsZip) continue
      const zipSource = [cityIsZip ? p.primaryCity : null, p.zipCodes, p.serviceZipCodes]
        .filter(Boolean).join(',')
      const zip = zipSource.split(/[^\d]+/).find((z) => /^\d{5}$/.test(z))
      if (!zip) continue
      const info = zipcodes.lookup(zip) as { city?: string; state?: string } | undefined
      if (!info?.city || !info?.state) continue
      const city = normalizeCityName(info.city)
      if (city) set('geo-zip', p.id, p.name, 'primaryCity', p.primaryCity, city)
      if (!p.primaryState?.trim()) set('geo-zip', p.id, p.name, 'primaryState', p.primaryState, info.state)
    }
  }

  // ── STEP geo-cityjunk: unusable primaryCity → recover, else null ───
  // Scraped page titles ("Drug Testing Near Katy", "Naples With 30 Miles
  // Radius") landed in primaryCity. Most still contain the real city, so try
  // to pull a known CITY_MAPPING city out of the string — scoped to the
  // provider's state so "Mobile" the city can't hijack "mobile phlebotomy".
  // Only null when nothing recognizable is in there.
  if (stepEnabled('geo')) {
    const junkCity = (c: string) => {
      const t = c.trim()
      if (t.split(/\s+/).length > 4) return true
      return /\b(near|drug|testing|labs?|medical|phlebotomy|services|hospital|center|clinic|home|about)\b/i.test(t)
    }
    // Longest-first so "Staten Island" wins over a hypothetical "Staten".
    const citiesByState = new Map<string, { name: string }[]>()
    for (const info of Object.values(CITY_MAPPING)) {
      citiesByState.set(info.state, [...(citiesByState.get(info.state) || []), { name: info.name }])
    }
    for (const list of citiesByState.values()) list.sort((a, b) => b.name.length - a.name.length)

    for (const p of live) {
      const pending = (patches.get(p.id) || {}) as Record<string, string | null>
      const city = ('primaryCity' in pending ? pending.primaryCity : p.primaryCity)?.trim()
      if (!city || !junkCity(city)) continue

      const state = ('primaryState' in pending ? pending.primaryState : p.primaryState)?.trim()?.toUpperCase()
      const found = state
        ? citiesByState.get(state)?.find((c) => new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(city))
        : undefined

      set('geo-cityjunk', p.id, p.name, 'primaryCity', p.primaryCity, found?.name ?? null)
      if (!found) set('geo-cityjunk', p.id, p.name, 'primaryCitySlug', p.primaryCitySlug, null)
    }
  }

  // ── STEP geo-derive: backfill every derived geo column ─────────────
  // Runs last so it sees the corrected state/city values from the steps above.
  if (stepEnabled('geo')) {
    for (const p of live) {
      const pending = (patches.get(p.id) || {}) as Record<string, string | null>
      const state = ('primaryState' in pending ? pending.primaryState : p.primaryState)?.trim() || null
      const city = ('primaryCity' in pending ? pending.primaryCity : p.primaryCity)?.trim() || null

      if (state && STATE_NAMES[state]) {
        set('geo-derive', p.id, p.name, 'primaryStateName', p.primaryStateName, STATE_NAMES[state])
        set('geo-derive', p.id, p.name, 'primaryStateSlug', p.primaryStateSlug, stateSlugOf(state))
      }
      if (city) {
        const normalized = normalizeCityName(city)
        if (normalized && normalized !== city) set('geo-derive', p.id, p.name, 'primaryCity', city, normalized)
        const slug = citySlug(normalized)
        if (slug) set('geo-derive', p.id, p.name, 'primaryCitySlug', p.primaryCitySlug, slug)
      }
    }
  }

  // ── STEP web: protocol-less / malformed website URLs ───────────────
  if (stepEnabled('web')) {
    for (const p of live) {
      const raw = p.website?.trim()
      if (!raw) continue
      if (CONTACT_FIXES[p.slug]?.website !== undefined) continue // hand-corrected below
      let ok = false
      try { ok = ['http:', 'https:'].includes(new URL(raw).protocol) } catch { ok = false }
      if (ok) continue
      set('web', p.id, p.name, 'website', raw, repairUrl(raw))
    }
  }

  // ── STEP contact: the individually-reviewed phone/email repairs ────
  if (stepEnabled('contact')) {
    for (const p of live) {
      const fix = CONTACT_FIXES[p.slug]
      if (!fix) continue
      for (const [field, to] of Object.entries(fix)) {
        set('contact', p.id, p.name, field, (p as unknown as Record<string, unknown>)[field], to)
      }
    }
  }

  // ── STEP desc: sync descriptionFlagged with the live detector ──────
  // Both directions — unflagged junk renders garbage publicly, and a stale
  // flag on now-clean copy shows "Contact for details." for no reason.
  if (stepEnabled('desc')) {
    for (const p of live) {
      const isJunk = detectJunkDescription(p.description).isJunk
      if (isJunk && !p.descriptionFlagged) set('desc', p.id, p.name, 'descriptionFlagged', false, true)
      if (!isJunk && p.descriptionFlagged && p.description?.trim()) set('desc', p.id, p.name, 'descriptionFlagged', true, false)
    }
  }

  // ── STEP testrow: soft-remove internal test listings ───────────────
  if (stepEnabled('testrow')) {
    for (const p of all) {
      if (!isTestRow(p.name)) continue
      set('testrow', p.id, p.name, 'removedAt', null, new Date())
      set('testrow', p.id, p.name, 'removedReason', null, 'internal test row')
      set('testrow', p.id, p.name, 'doNotRelist', false, true)
      set('testrow', p.id, p.name, 'eligibleForLeads', undefined, false)
    }
  }

  // ── report ─────────────────────────────────────────────────────────
  const steps = [...new Set(changes.map((c) => c.step))]
  console.log('═'.repeat(78))
  console.log(APPLY ? 'PROVIDER CLEANUP — APPLYING' : 'PROVIDER CLEANUP — DRY RUN (no writes)')
  console.log('═'.repeat(78))
  for (const step of steps) {
    const rows = changes.filter((c) => c.step === step)
    console.log(`\n── ${step} — ${rows.length} field changes on ${new Set(rows.map((r) => r.id)).size} providers`)
    for (const c of rows) {
      const from = c.from === null || c.from === undefined ? '∅' : JSON.stringify(c.from)
      const to = c.to === null ? '∅' : JSON.stringify(c.to)
      console.log(`   ${c.name.slice(0, 36).padEnd(36)} ${c.field.padEnd(18)} ${String(from).slice(0, 42).padEnd(42)} → ${String(to).slice(0, 46)}`)
    }
  }
  console.log(`\n${'═'.repeat(78)}`)
  console.log(`TOTAL: ${changes.length} field changes across ${patches.size} providers`)

  if (!APPLY) {
    console.log('Dry run — nothing written. Re-run with --apply to commit.')
    await prisma.$disconnect()
    return
  }

  let done = 0
  for (const [id, data] of patches) {
    await prisma.provider.update({ where: { id }, data: data as never })
    done++
  }
  console.log(`Applied to ${done} providers.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
