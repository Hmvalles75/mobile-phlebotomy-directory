import { getDistanceBetweenZips, isLeadInServiceRadius } from './zip-geocode'

/**
 * The one answer to "does this provider serve this lead?"
 *
 * Until 2026-09-18 six places decided this on their own (the router, the
 * provider dashboard's available-leads list, the admin rematch page, the
 * catch-missed cron, the admin coverage map, the SMS routing), all
 * inclusion-only: a radius or ZIP list could add areas but nothing could
 * remove one. A Long Island provider whose 70-mile radius reaches Brooklyn
 * got Brooklyn leads she declines; a Maryland provider with a 100-mile radius
 * claimed a Delaware patient and then said they don't serve Delaware; a Dallas
 * provider with a 50-mile radius said "we have no phlebotomist in
 * Farmersville". Three paying or active providers hit it, so it is a feature.
 *
 * Order of evaluation, first match wins:
 *   1. No ZIPs on the record: cannot judge, does not serve.
 *   2. Excluded state, or excluded ZIP token: does not serve. Exclusions beat
 *      radius, the ZIP list, and the fan-out floor.
 *   3. Farther than MAX_ROUTING_DISTANCE_MILES from the primary ZIP: no.
 *   4. Inside the radius from the primary ZIP: yes.
 *   5. Explicit ZIP token match (exact, "112*" prefix, "10000-10499" range),
 *      as long as the token itself sits within MAX_LISTED_ZIP_DISTANCE_MILES
 *      of the primary ZIP (a typo like 90210 on an Ohio record is ignored).
 *
 * Both `zipCodes` and `excludedZipCodes` use the same token grammar.
 */

/** Beyond this, a lead is never routed even if the radius says otherwise. */
export const MAX_ROUTING_DISTANCE_MILES = 100
/** A listed ZIP token farther than this from the primary ZIP is treated as a typo. */
export const MAX_LISTED_ZIP_DISTANCE_MILES = 150

export interface CoverageRecord {
  zipCodes?: string | null
  serviceRadiusMiles?: number | null
  excludedZipCodes?: string | null
  excludedStates?: string | null
}

export type CoverageReason =
  | 'no_zips' | 'excluded_state' | 'excluded_zip' | 'too_far' | 'radius' | 'zip_list' | 'not_covered'

export interface CoverageVerdict {
  serves: boolean
  reason: CoverageReason
  /** Miles from the provider's primary ZIP, when both geocode. */
  distance: number | null
}

export function parseZipTokens(raw: string | null | undefined): string[] {
  return (raw || '').split(/[,\n;]+/).map(z => z.trim()).filter(z => z.length >= 3)
}

export function parseStates(raw: string | null | undefined): string[] {
  return (raw || '').split(/[,\s;]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s))
}

/** The provider's home ZIP: the first 5-digit token in the list. */
export function primaryZipOf(record: Pick<CoverageRecord, 'zipCodes'>): string | null {
  return parseZipTokens(record.zipCodes).find(z => /^\d{5}$/.test(z)) || null
}

/** Exact, prefix ("112*" or a bare 3-digit prefix) or range ("10000-10499"). */
export function zipMatchesToken(zip: string, token: string): boolean {
  const z = zip.replace(/\D/g, '').slice(0, 5)
  if (z.length !== 5) return false
  const t = token.trim()
  if (/^\d{5}$/.test(t)) return z === t
  if (/^\d{3,4}\*?$/.test(t)) return z.startsWith(t.replace('*', ''))
  if (/^\d{5}\s*-\s*\d{5}$/.test(t)) {
    const [start, end] = t.split('-').map(x => x.trim())
    return z >= start && z <= end
  }
  return false
}

export function isExcluded(record: CoverageRecord, zip: string, state?: string | null): CoverageReason | null {
  if (state && parseStates(record.excludedStates).includes(state.toUpperCase())) return 'excluded_state'
  if (parseZipTokens(record.excludedZipCodes).some(t => zipMatchesToken(zip, t))) return 'excluded_zip'
  return null
}

export function providerServesLead(record: CoverageRecord, leadZip: string, leadState?: string | null): CoverageVerdict {
  const primary = primaryZipOf(record)
  if (!primary) return { serves: false, reason: 'no_zips', distance: null }
  const distance = getDistanceBetweenZips(primary, leadZip)

  const excluded = isExcluded(record, leadZip, leadState)
  if (excluded) return { serves: false, reason: excluded, distance }

  if (distance !== null && distance > MAX_ROUTING_DISTANCE_MILES) return { serves: false, reason: 'too_far', distance }

  const radius = record.serviceRadiusMiles || 25
  if (isLeadInServiceRadius(primary, leadZip, radius)) return { serves: true, reason: 'radius', distance }

  const plausible = (token: string) => {
    const anchor = token.replace('*', '').split('-')[0].trim().padEnd(5, '0')
    const d = getDistanceBetweenZips(primary, anchor)
    return d === null || d <= MAX_LISTED_ZIP_DISTANCE_MILES
  }
  const listed = parseZipTokens(record.zipCodes).some(t => zipMatchesToken(leadZip, t) && plausible(t))
  if (listed) return { serves: true, reason: 'zip_list', distance }

  return { serves: false, reason: 'not_covered', distance }
}
